# 15. Linux 組み込みイメージ — U-Boot・カーネル・ルートファイルシステム

> **この章のゴール.**
>
> Linux ベースの機器（ルータ、IP カメラ、ゲートウェイ）のフラッシュを、
> **ブートローダ・カーネル・デバイスツリー・ルートファイルシステム**の 4 層に分解し、
> `binwalk` / `unblob` で展開してファイルを取り出せるようになること。

## 1. マイコンとの違い

これまでの章は「ベアメタル / RTOS のマイコン」だった。
Linux が動く組み込み機器（Cortex-A、MIPS、一部の RISC-V）は、**PC の Linux に近い層構造**を持ち、道具も Linux 寄りになる。フラッシュは NOR / NAND / eMMC で、容量は数 MB〜数 GB と大きい。

典型的な層:

| 層 | 役割 | 形式 |
|---|---|---|
| **1 次 / 2 次ブートローダ** | チップ ROM → U-Boot | 生バイナリ、SPL（Secondary Program Loader、U-Boot 本体を読み込む小さな前段） |
| **U-Boot** | カーネルを読み込んで起動 | uImage、環境変数領域 |
| **カーネル** | Linux 本体 | zImage / Image（多くは圧縮） |
| **デバイスツリー（DTB）** | ハードウェア構成の記述 | `0xd00dfeed` |
| **ルートファイルシステム** | `/bin` `/etc` `/lib`… | squashfs / JFFS2 / UBIFS / ext4 |
| **オーバーレイ / データ** | 設定・ログ | JFFS2 / UBIFS / ext4 |

```fig
b15_layers
```

## 2. まず binwalk / unblob で全体を割る

Linux イメージは既知形式の塊なので、`binwalk` の独壇場である。

```sh
binwalk fullflash.bin            # 各層のオフセットと種類を一覧
binwalk -e fullflash.bin         # 抽出（_fullflash.bin.extracted/ に展開）
unblob fullflash.bin             # より堅牢な抽出（推奨）
```

出力例:

```
DECIMAL    HEX        DESCRIPTION
0          0x0        U-Boot SPL
131072     0x20000    uImage header, ... Linux kernel, lzma compressed
1310720    0x140000   Squashfs filesystem, little endian, ...
6291456    0x600000   JFFS2 filesystem
```

これで 1 章のメモリマップがほぼ完成する。以降は各層を個別に開く。

## 3. U-Boot と環境変数

**U-Boot** は Linux 組み込みで最も普及したブートローダである。解析で有用なのは**環境変数領域**で、`bootcmd`（起動コマンド）、`bootargs`（カーネルに渡す引数）、ネットワーク設定などが**平文のテキスト**で入っている。

- 環境変数領域は先頭に **CRC32（4 バイト）**、その後に `名前=値\0` が並び、`\0\0` で終わる
- `strings` で `bootargs=`, `bootcmd=`, `ipaddr=` を探せば見つかる
- `bootargs` の `root=` は、ルートファイルシステムがどのデバイス / パーティションかを教える

```sh
strings uboot_env.bin | grep -E "bootcmd|bootargs|mtdparts"
# mtdparts=... はフラッシュのパーティション分割（オフセットと名前）を教える貴重な情報
```

**`mtdparts`** はフラッシュのパーティション表そのもので、「どのオフセットが kernel / rootfs / config か」が名前付きで書いてある。メモリマップの決定版になる。

## 4. カーネルとデバイスツリー

- **uImage**: U-Boot 形式のヘッダ（マジック `0x27051956`）+ 圧縮カーネル。ヘッダにロードアドレス・エントリ・名前・CRC。`dumpimage -l uImage` で情報、`binwalk -e` で中の zImage を取り出す
- **zImage / Image**: 圧縮された（gzip / lzma / lz4）カーネル。展開すると生カーネル。`vmlinux-to-elf` で解析用 ELF にできることもある
- **DTB（デバイスツリー blob）**: マジック `0xd00dfeed`（ビッグエンディアン）。ハードウェア構成（メモリ、周辺、パーティション）を記述。`dtc -I dtb -O dts board.dtb` でテキスト（DTS）に戻せる。**機器のハードウェア構成の設計図**として非常に有用

```sh
dtc -I dtb -O dts board.dtb -o board.dts     # デバイスツリーを人が読める形に
grep -A3 partition board.dts                 # フラッシュ分割の定義
```

## 5. ルートファイルシステムを開く

ここに**実行ファイル・設定・スクリプト・鍵**が全部ある。形式ごとに展開ツールが違う。

| 形式 | 特徴 | 展開 |
|---|---|---|
| **squashfs** | 読み取り専用・圧縮。最も一般的 | `unsquashfs rootfs.squashfs` |
| **JFFS2** | 書き込み可・NOR 向け | `jefferson rootfs.jffs2` |
| **UBIFS** | NAND 向け（UBI の上） | `ubireader_extract_files`、`ubidump` |
| **ext2/3/4** | eMMC / 大容量 | マウント、`debugfs`、`7z` |
| **cramfs** | 古い読み取り専用 | `cramfsck -x` |

```sh
unsquashfs -d rootfs rootfs.squashfs         # ./rootfs/ に全ファイル
ls rootfs/etc/                                # 設定ファイル
cat rootfs/etc/passwd rootfs/etc/shadow       # ユーザとパスワードハッシュ
```

```fig
b15_rootfs
```

## 6. ルートファイルシステムから何を読むか

取り出した `/` は、機器のソフト構成そのものである。監査で見る場所:

- **`/etc/passwd` `/etc/shadow`**: ユーザとパスワードハッシュ。弱いハッシュ（DES、MD5）や、**全機器共通のハードコードされたパスワード**は脆弱性（13 章）
- **`/etc/init.d` `/etc/rc*` systemd unit**: 起動時に何が動くか。裏口サービス、telnet の有効化
- **`/etc/ssl` `/etc/*/keys`**: 証明書と秘密鍵（13 章の対象）
- **`/etc/config` `/etc/*.conf`**: ネットワーク・サービス設定、資格情報
- **`/bin` `/sbin` `/usr/bin`**: 独自バイナリ。busybox の版、ベンダ製アプリ → 16 章の逆アセンブル対象
- **`/www` `/etc/www`**: Web UI。CGI、脆弱なスクリプト
- **バージョン**: `/etc/os-release`、`/etc/banner`、busybox のバージョン → 既知の脆弱性（CVE）の照合

## 7. NAND 特有の面倒

NAND フラッシュのダンプには、**OOB（Out-Of-Band）領域**（各ページの後ろに付く ECC / バッドブロック情報）が混じることがある。生の NAND ダンプは、データとOOBが交互に並んで見え、そのままでは展開できない。

- ダンプツールが OOB を除いてくれているか確認する
- 混じっている場合、ページサイズと OOB サイズ（例 2048 + 64）を特定し、OOB を剥がす（`nandtool`、自作スクリプト）
- UBI / UBIFS は論理層で、この上に乗る。`ubireader` は UBI ヘッダから読み解く

## 8. 手を動かす

### Linux イメージを層に分ける

---

## この章のポイント

- Linux 機器は **ブートローダ・カーネル・DTB・ルートFS** の層構造。道具は Linux 寄り
- まず **`binwalk -e` / `unblob`** で全層を割る。メモリマップがほぼ完成する
- **U-Boot の環境変数**（`bootargs`、`mtdparts`）と **DTB**（`dtc` で DTS に）が、パーティション構成の決定版
- ルートFSは **squashfs（`unsquashfs`）/ JFFS2 / UBIFS / ext4**。`/etc/shadow`・鍵・独自バイナリを監査
- NAND は **OOB / ECC** が混じることがある。剥がしてから展開

→ 次: [16. 逆アセンブルの基礎](16_逆アセンブルの基礎.md)
