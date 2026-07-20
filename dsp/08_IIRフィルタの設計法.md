# 08. IIR フィルタの設計法

IIR 設計の王道は「**よくできたアナログフィルタを設計し、それをデジタルに変換する**」という 2 段構え。
アナログフィルタ理論には 100 年分の蓄積（バタワース、チェビシェフ、楕円）があり、それを丸ごと流用する。

```
仕様（カットオフ、減衰量）
   ↓ ①アナログプロトタイプ設計（バタワース等）→ H_a(s)
   ↓ ②s領域 → z領域 変換（双一次変換 or インパルス不変法）→ H(z)
デジタル IIR フィルタ（係数 a_k, b_k）
```

## 0. 前提: ラプラス変換と s 平面（最小限）

アナログ側では Z 変換の連続時間版である**ラプラス変換**を使う:

$$
H_a(s) = \int_{-\infty}^{\infty} h_a(t)\, e^{-st}\, dt, \qquad s = \sigma + j\Omega
$$

- $s = j\Omega$（虚軸上）で評価するとフーリエ変換 = アナログの周波数特性。
  （Z 変換で単位円上が周波数特性だったのと並行的。）
- アナログの安定条件は「**極が左半平面（$\mathrm{Re}(s) < 0$）**」。
  理由: 極 $s_0 = \sigma_0 + j\Omega_0$ は時間応答 $e^{s_0 t} = e^{\sigma_0 t}e^{j\Omega_0 t}$ を生み、
  $\sigma_0 < 0$ のときだけ $|e^{s_0 t}| = e^{\sigma_0 t} \to 0$ と減衰するから。

| | アナログ (s 平面) | デジタル (z 平面) |
|---|---|---|
| 周波数特性を読む場所 | 虚軸 $s = j\Omega$ | 単位円 $z = e^{j\omega}$ |
| 安定領域（極の置き場） | 左半平面 | 単位円の内側 |

(a) 基本対 $e^{s_0 t}u(t) \leftrightarrow \dfrac{1}{s-s_0}$ の導出
$$
X(s) = \int_0^\infty e^{s_0 t}, e^{-st}, dt = \int_0^\infty e^{(s_0 - s)t}, dt
= \left[\frac{e^{(s_0-s)t}}{s_0 - s}\right]_0^\infty
$$

$\mathrm{Re}(s) > \mathrm{Re}(s_0)$ のとき $|e^{(s_0-s)t}| = e^{\mathrm{Re}(s_0-s)t} \to 0$（$t\to\infty$）なので上端は 0:

$$
X(s) = \frac{0 - 1}{s_0 - s} = \frac{1}{s - s_0}, \qquad \text{ROC}: \mathrm{Re}(s) > \mathrm{Re}(s_0) \qquad\blacksquare
$$

(b) 「$1/s$ = 積分器」の導出
初期静止（$x(0)=0$、因果的）の信号に対し、微分のラプラス変換を部分積分で計算:

$$
\int_0^\infty x'(t), e^{-st}, dt
= \Big[x(t), e^{-st}\Big]_0^\infty + s\int_0^\infty x(t), e^{-st}, dt
= 0 + s X(s)
$$

（上端は ROC 内で $x(t)e^{-st}\to 0$、下端は $x(0)=0$ で消える。）
つまり微分 ↔ $s$ 倍。ゆえに $y(t) = \int_{-\infty}^t x,d\tau$ なら $y' = x$ より $sY = X$、すなわち積分 ↔ $\dfrac{1}{s}$ 倍。∎

(c) 「安定 ⟺ 極が左半平面」の導出
因果的で有理な $H_a(s)$（単根とする）を部分分数展開（05 章のヘヴィサイド法と同一手順）すると、(a) の対から:

$$
h_a(t) = \sum_i A_i, e^{s_i t}, u(t), \qquad s_i = \sigma_i + j\Omega_i
$$

連続時間の BIBO 安定条件は $\int_0^\infty |h_a(t)|,dt < \infty$（03 章の離散版と同じ論法: 和を積分に替えるだけ）。
$|e^{s_i t}| = e^{\sigma_i t},|e^{j\Omega_i t}| = e^{\sigma_i t}$ に注意して:

$$
\int_0^\infty |h_a|,dt \leq \sum_i |A_i| \int_0^\infty e^{\sigma_i t}, dt,
\qquad
\int_0^\infty e^{\sigma t},dt = \left[\frac{e^{\sigma t}}{\sigma}\right]_0^\infty
= \begin{cases}-\dfrac{1}{\sigma} < \infty & (\sigma < 0)\ \infty & (\sigma \geq 0)\end{cases}
$$

全極で $\sigma_i < 0$ なら有限和で安定。逆にある $\sigma_1 \geq 0$ なら $|h_a(t)|$ が 0 に減衰せず発散（06 章の支配極の議論と同一）。∎

## 1. バタワースフィルタ

### 定義

$N$ 次バタワースローパスフィルタの振幅特性:

$$
|H_a(j\Omega)|^2 = \frac{1}{1 + \left(\dfrac{\Omega}{\Omega_c}\right)^{2N}}
$$

$\Omega_c$: カットオフ角周波数、$N$: 次数。

### 性質の導出 1: カットオフでの値

$\Omega = \Omega_c$ で $|H_a|^2 = \frac{1}{1+1} = \frac{1}{2}$、つまり $|H_a| = \frac{1}{\sqrt 2}$（**−3.01 dB**）。次数によらない。

### 性質の導出 2: 最大平坦性 (maximally flat)

$x = (\Omega/\Omega_c)^2$ とおくと $|H_a|^2 = \frac{1}{1 + x^N}$。これを $x=0$ の周りでテイラー展開する。
$|u| < 1$ での等比級数 $\frac{1}{1+u} = 1 - u + u^2 - \cdots$ に $u = x^N$ を代入:

$$
|H_a(j\Omega)|^2 = 1 - x^N + x^{2N} - \cdots = 1 - \left(\frac{\Omega}{\Omega_c}\right)^{2N} + \cdots
$$

$\Omega$ に関する $1$ 次から $2N-1$ 次までの導関数が $\Omega = 0$ ですべて 0
（展開に $\Omega^2, \Omega^4, \dots, \Omega^{2N-2}$ の項が存在しないため）。

> **直感**: バタワースは「通過帯域を可能な限り平坦（リプルなし）にする」ことに全振りした設計。
> 音質・計測など「通過帯域を汚したくない」用途の第一候補。代償として遮断の鋭さはチェビシェフに劣る。

### 性質の導出 3: 高域での減衰傾度

$\Omega \gg \Omega_c$ では $|H_a|^2 \approx (\Omega/\Omega_c)^{-2N}$、つまり $|H_a| \approx (\Omega/\Omega_c)^{-N}$。
デシベルでは

$$
20\log_{10}|H_a| \approx -20N \log_{10}\frac{\Omega}{\Omega_c}
$$

周波数が 10 倍になるごとに $-20N$ dB。すなわち **$-20N$ dB/decade（$-6N$ dB/oct）**。次数 1 つで 6dB/oct 稼げる。

### 極の位置の導出

$|H_a(j\Omega)|^2 = H_a(s)H_a(-s)\big|_{s=j\Omega}$ という関係を使う
（実係数なら $\overline{H_a(j\Omega)} = H_a(-j\Omega)$ なので $|H_a(j\Omega)|^2 = H_a(j\Omega)H_a(-j\Omega)$、
これを $s = j\Omega \Leftrightarrow \Omega = s/j$ で解析接続する）。
$\Omega^2 = (s/j)^2 = -s^2$ より:

$$
H_a(s)\,H_a(-s) = \frac{1}{1 + \left(\dfrac{-s^2}{\Omega_c^2}\right)^{N}}
$$

極は分母 = 0、すなわち:

$$
\left(\frac{-s^2}{\Omega_c^2}\right)^{N} = -1
\quad\Longleftrightarrow\quad
s^{2N} = (-1)^{N+1}\, \Omega_c^{2N}
$$

右辺を極形式で書く。$(-1)^{N+1} = e^{j\pi(N+1)}$ であり、$1 = e^{j2\pi k}$（$k$ 整数）を掛けられるので:

$$
s^{2N} = \Omega_c^{2N}\, e^{j\pi(N + 1 + 2k)}
$$

$2N$ 乗根をとる:

$$
s_k = \Omega_c\, \exp\!\left(j\pi\, \frac{N + 1 + 2k}{2N}\right), \qquad k = 0, 1, \dots, 2N-1
$$

**極は半径 $\Omega_c$ の円周上に等間隔（角度間隔 $\pi/N$）に並ぶ**。
このうち左半平面にある $N$ 個（$\mathrm{Re}(s_k) < 0$ のもの）を $H_a(s)$ に採用する
（安定なフィルタにするため。残り $N$ 個は $H_a(-s)$ 側の極)。

**具体例 $N=2$ の導出**: $k = 0,1,2,3$ で角度は $\pi\frac{3}{4}, \pi\frac{5}{4}, \pi\frac{7}{4}, \pi\frac{9}{4}$。
左半平面（角度が $\pi/2$ 〜 $3\pi/2$）にあるのは $\frac{3\pi}{4}$ と $\frac{5\pi}{4}$:

$$
s_{1,2} = \Omega_c\, e^{j3\pi/4},\; \Omega_c\, e^{j5\pi/4} = \Omega_c\left(-\frac{1}{\sqrt2} \pm j\frac{1}{\sqrt2}\right)
$$

伝達関数を組み立てる（分子は直流ゲイン 1 になるよう $\Omega_c^2$）:

$$
H_a(s) = \frac{\Omega_c^2}{(s - s_1)(s - s_2)}
= \frac{\Omega_c^2}{s^2 - (s_1 + s_2)s + s_1 s_2}
$$

$s_1 + s_2 = -\sqrt{2}\,\Omega_c$、$s_1 s_2 = \Omega_c^2 e^{j(3\pi/4 + 5\pi/4)} = \Omega_c^2 e^{j2\pi} = \Omega_c^2$ より:

$$
\boxed{\;H_a(s) = \frac{\Omega_c^2}{s^2 + \sqrt{2}\,\Omega_c\, s + \Omega_c^2}\;}
$$

これが 2 次バタワースの標準形（後の設計例で使う）。

## 2. チェビシェフフィルタ(概要と基本式の導出)

**チェビシェフ I 型**:

$$
|H_a(j\Omega)|^2 = \frac{1}{1 + \varepsilon^2\, T_N^2\!\left(\dfrac{\Omega}{\Omega_c}\right)}
$$

$T_N$ は**チェビシェフ多項式**: $T_N(\cos\phi) = \cos(N\phi)$ で定義される。

**漸化式の導出**: 加法定理より

$$
\cos((N+1)\phi) + \cos((N-1)\phi) = 2\cos(N\phi)\cos\phi
$$

（右辺の展開: $\cos(N\phi \pm \phi) = \cos N\phi \cos\phi \mp \sin N\phi \sin\phi$ を足すと $\sin$ の項が消える。）
$x = \cos\phi$ とおけば:

$$
T_{N+1}(x) = 2x\, T_N(x) - T_{N-1}(x), \qquad T_0(x) = 1,\; T_1(x) = x
$$

例: $T_2(x) = 2x^2 - 1$、$T_3(x) = 4x^3 - 3x$。

**性質**: $|x| \leq 1$ では $T_N(x) = \cos(N \arccos x)$ は $-1$ と $1$ の間を等振幅で振動し、
$|x| > 1$ では $T_N(x) = \cosh(N\,\mathrm{arccosh}\, x)$ となって急激に増大する。

> **直感**: 通過帯域（$\Omega < \Omega_c$）ではわざと $\varepsilon$ の大きさのリプル（さざ波）を許し、
> その見返りに阻止帯域での減衰が同次数のバタワースより急峻になる。
> 「平坦さを売って遮断の鋭さを買う」トレードオフ。楕円（Cauer）フィルタはさらに阻止帯域のリプルも
> 許して最急峻を実現する。

## 3. 双一次変換(bilinear transform) — s から z への橋

### 導出（台形積分による）

積分器 $y(t) = \int x(t)\,dt$、すなわち $H_a(s) = \dfrac{1}{s}$ をデジタルで近似することを考える
（任意のアナログ伝達関数は積分器の組み合わせで書けるので、積分器の対応を決めればすべて決まる）。

時刻 $t = nT$ と $t = (n-1)T$ の間の積分を**台形則**で近似する:

$$
y(nT) = y((n-1)T) + \int_{(n-1)T}^{nT} x(t)\, dt
\approx y((n-1)T) + \frac{T}{2}\left[x(nT) + x((n-1)T)\right]
$$

（台形則: 区間幅 × 両端の平均高さ。）離散信号として書き直す:

$$
y[n] = y[n-1] + \frac{T}{2}\left(x[n] + x[n-1]\right)
$$

Z 変換する:

$$
Y(z) = z^{-1}Y(z) + \frac{T}{2}\left(X(z) + z^{-1}X(z)\right)
$$

$$
Y(z)\,(1 - z^{-1}) = \frac{T}{2}(1 + z^{-1})\, X(z)
\quad\Longrightarrow\quad
\frac{Y(z)}{X(z)} = \frac{T}{2}\cdot\frac{1 + z^{-1}}{1 - z^{-1}}
$$

これがアナログ積分器 $\frac{1}{s}$ のデジタル版。よって対応関係は:

$$
\frac{1}{s} \;\longleftrightarrow\; \frac{T}{2}\cdot\frac{1+z^{-1}}{1-z^{-1}}
\quad\Longleftrightarrow\quad
\boxed{\;s = \frac{2}{T}\cdot\frac{1 - z^{-1}}{1 + z^{-1}}\;}
$$

デジタルフィルタは $H(z) = H_a(s)\big|_{s = \frac{2}{T}\frac{1-z^{-1}}{1+z^{-1}}}$ で得られる。

### 性質の導出 1: 安定性が保存される

$s = \sigma + j\Omega$ に対応する $z$ を求める。上式を $z$ について解く:

$$
s\frac{T}{2}(1 + z^{-1}) = 1 - z^{-1}
\;\Longrightarrow\;
z^{-1}\left(1 + s\frac{T}{2}\right) = 1 - s\frac{T}{2}
\;\Longrightarrow\;
z = \frac{1 + sT/2}{1 - sT/2}
$$

絶対値を評価する。$s = \sigma + j\Omega$ を代入:

$$
|z|^2 = \frac{|1 + \sigma T/2 + j\Omega T/2|^2}{|1 - \sigma T/2 - j\Omega T/2|^2}
= \frac{(1 + \sigma T/2)^2 + (\Omega T/2)^2}{(1 - \sigma T/2)^2 + (\Omega T/2)^2}
$$

分子と分母の差は:

$$
(1 + \sigma T/2)^2 - (1 - \sigma T/2)^2 = 4 \cdot \frac{\sigma T}{2} = 2\sigma T
$$

よって:
- $\sigma < 0$（左半平面）⇒ 分子 < 分母 ⇒ $|z| < 1$（単位円内）
- $\sigma = 0$（虚軸）⇒ $|z| = 1$（単位円上）
- $\sigma > 0$ ⇒ $|z| > 1$

> **左半平面全体が単位円の内側にきれいに写る。したがって安定なアナログフィルタを双一次変換すると
> 必ず安定なデジタルフィルタになる。** これが双一次変換が標準になっている最大の理由。∎

### 性質の導出 2: 周波数の対応（ワーピング）

アナログの周波数軸 $s = j\Omega$ がデジタルの周波数軸 $z = e^{j\omega}$ のどこに写るかを計算する。
$z = e^{j\omega}$ を代入:

$$
s = \frac{2}{T}\cdot\frac{1 - e^{-j\omega}}{1 + e^{-j\omega}}
$$

分子・分母から $e^{-j\omega/2}$ を括り出す:

$$
= \frac{2}{T}\cdot\frac{e^{-j\omega/2}\left(e^{j\omega/2} - e^{-j\omega/2}\right)}{e^{-j\omega/2}\left(e^{j\omega/2} + e^{-j\omega/2}\right)}
= \frac{2}{T}\cdot\frac{2j\sin(\omega/2)}{2\cos(\omega/2)}
= j\,\frac{2}{T}\tan\frac{\omega}{2}
$$

（02 章の $\sin\theta = \frac{e^{j\theta}-e^{-j\theta}}{2j}$、$\cos\theta = \frac{e^{j\theta}+e^{-j\theta}}{2}$ を使用。）
$s = j\Omega$ と比較して:

$$
\boxed{\;\Omega = \frac{2}{T}\tan\frac{\omega}{2}\;}
\qquad\Longleftrightarrow\qquad
\omega = 2\arctan\frac{\Omega T}{2}
$$

### 直感: 無限を有限に折り畳む

アナログの周波数軸は $0 \to \infty$ の無限長。デジタルの周波数軸は $0 \to \pi$ の有限長。
双一次変換は $\tan$ を使って**無限の軸を有限区間に非線形に圧縮**する:

- 低域 ($\omega \ll 1$): $\tan(\omega/2) \approx \omega/2$ より $\Omega \approx \omega / T$ — ほぼ線形（歪みなし）
- 高域: $\omega \to \pi$ で $\Omega \to \infty$ — アナログの無限遠が $\omega = \pi$ に圧縮される

この非線形圧縮を**周波数ワーピング**と呼ぶ。エイリアシングは発生しない（軸の折り返しではなく圧縮だから）が、
指定したカットオフが意図とズレるという副作用がある。

### プリワーピング（ズレの補正）

デジタルでカットオフ $\omega_c$ を実現したければ、アナログプロトタイプのカットオフを最初から

$$
\Omega_c = \frac{2}{T}\tan\frac{\omega_c}{2}
$$

に「ずらして」設計しておけば、変換後にちょうど $\omega_c$ に着地する。これを**プリワーピング**という。
（ワーピングで曲がる分をあらかじめ逆向きに曲げておく、という素直な発想。）

## 4. 設計例: 2 次バタワース・デジタルローパスの完全導出

**仕様**: $f_s = 48$ kHz、カットオフ $f_c = 1$ kHz → $\omega_c = 2\pi f_c / f_s = 2\pi/48 \approx 0.13090$ rad/sample

**ステップ 1: プリワーピング**

$$
\Omega_c = \frac{2}{T}\tan\frac{\omega_c}{2}
$$

（以後の式では $K \equiv \frac{2}{T}\cot\frac{\omega_c}{2}$ の形にまとまるので $T$ は消える。数値では
$\tan(\omega_c/2) = \tan(0.06545) \approx 0.065544$。）

**ステップ 2: アナログプロトタイプ**（§1 で導出済みの 2 次バタワース）

$$
H_a(s) = \frac{\Omega_c^2}{s^2 + \sqrt{2}\,\Omega_c s + \Omega_c^2}
$$

**ステップ 3: 双一次変換を代入**

$s = \frac{2}{T}\frac{1-z^{-1}}{1+z^{-1}}$ を代入し、記号を軽くするため

$$
\lambda \equiv \tan\frac{\omega_c}{2} \quad\left(\text{つまり } \Omega_c = \frac{2}{T}\lambda\right)
$$

とおく。分子・分母を $\left(\frac{2}{T}\right)^2 (1+z^{-1})^2$ で通分すると $\frac{2}{T}$ が全部約分されて:

$$
H(z) = \frac{\lambda^2 (1+z^{-1})^2}{(1-z^{-1})^2 + \sqrt{2}\,\lambda\,(1-z^{-1})(1+z^{-1}) + \lambda^2 (1+z^{-1})^2}
$$

各項を展開する:

- $(1+z^{-1})^2 = 1 + 2z^{-1} + z^{-2}$
- $(1-z^{-1})^2 = 1 - 2z^{-1} + z^{-2}$
- $(1-z^{-1})(1+z^{-1}) = 1 - z^{-2}$

分母 $= (1 - 2z^{-1} + z^{-2}) + \sqrt2\lambda(1 - z^{-2}) + \lambda^2(1 + 2z^{-1} + z^{-2})$

$z^{-1}$ の次数ごとに整理:

$$
\begin{aligned}
z^0:&\quad 1 + \sqrt2\lambda + \lambda^2\\
z^{-1}:&\quad -2 + 2\lambda^2 = 2(\lambda^2 - 1)\\
z^{-2}:&\quad 1 - \sqrt2\lambda + \lambda^2
\end{aligned}
$$

先頭係数 $D \equiv 1 + \sqrt2\lambda + \lambda^2$ で全体を割って標準形（分母先頭 1）にする:

$$
\boxed{\;
H(z) = \frac{b_0 + b_1 z^{-1} + b_2 z^{-2}}{1 + a_1 z^{-1} + a_2 z^{-2}},\qquad
\begin{aligned}
b_0 &= b_2 = \frac{\lambda^2}{D}, \quad b_1 = \frac{2\lambda^2}{D}\\
a_1 &= \frac{2(\lambda^2 - 1)}{D}, \quad a_2 = \frac{1 - \sqrt2\lambda + \lambda^2}{D}
\end{aligned}\;}
$$

**ステップ 4: 数値を入れる** ($\lambda = 0.065544$, $\lambda^2 = 0.0042960$, $\sqrt2\lambda = 0.092694$, $D = 1.096990$)

$$
b_0 = b_2 = 0.0039162,\quad b_1 = 0.0078324,\quad
a_1 = -1.815341,\quad a_2 = 0.831006
$$

**検算 1（直流ゲイン）**: $H(1) = \frac{b_0+b_1+b_2}{1+a_1+a_2} = \frac{0.0156648}{0.015665} \approx 1.0$ ✓（ローパスは直流を素通し）

**検算 2（安定性、07 章の安定三角形）**: $|a_2| = 0.831 < 1$ ✓、$1 + a_1 + a_2 = 0.0157 > 0$ ✓、$1 - a_1 + a_2 = 3.646 > 0$ ✓ → 安定

**検算 3（零点）**: 分子 $\propto (1+z^{-1})^2$ → 二重零点が $z = -1$（$\omega = \pi$ = ナイキスト周波数）。
双一次変換がアナログの「$\Omega = \infty$ でゲイン 0」を $\omega = \pi$ に写した結果であり、ローパスとして理にかなっている。

このように**双一次変換は最終的に「係数の計算式」に落ちる**。世の中のオーディオ EQ の
「biquad cookbook」係数式（Robert Bristow-Johnson の Audio EQ Cookbook が有名）は、
すべてこの手順を各フィルタタイプについて実行した結果である。

## 5. もう一つの変換: インパルス不変法(参考)

**発想**: アナログフィルタのインパルス応答をそのままサンプリングする:

$$
h[n] = T\, h_a(nT)
$$

**極の写り方の導出**: アナログの 1 極 $H_a(s) = \frac{A}{s - s_0}$ のインパルス応答は
$h_a(t) = A e^{s_0 t} u(t)$（ラプラス逆変換の基本対。検算: $\int_0^\infty A e^{s_0 t} e^{-st} dt = \frac{A}{s - s_0}$、
$\mathrm{Re}(s) > \mathrm{Re}(s_0)$ で収束）。サンプリングすると:

$$
h[n] = T A\, e^{s_0 T n}\, u[n] = TA\, (e^{s_0 T})^n\, u[n]
$$

これは公比 $e^{s_0 T}$ の指数列なので、Z 変換は（05 章の基本対より）:

$$
H(z) = \frac{TA}{1 - e^{s_0 T} z^{-1}}
$$

つまり**極は $z = e^{s_0 T}$ に写る**。$\mathrm{Re}(s_0) < 0$ なら $|z| = e^{\mathrm{Re}(s_0) T} < 1$ で安定性も保存される。

**弱点**: 01 章で導出したとおり、サンプリングはスペクトルを $f_s$ おきに複製する。
アナログフィルタの特性は $\Omega = \infty$ まで裾を引くので、**複製が必ず重なりエイリアシングが起きる**。
ローパスには使えるが、ハイパスやバンドストップには使えない。これが双一次変換が標準である理由の裏面。

## 6. 設計法の選び方まとめ

| 方式 | 長所 | 短所 | 使いどころ |
|---|---|---|---|
| 双一次変換 | エイリアシングなし・安定性保存 | 周波数軸が歪む（プリワーピングで補正） | **デフォルト。EQ、汎用フィルタ全般** |
| インパルス不変法 | 時間波形（インパルス応答）を保存 | エイリアシング。LPF 限定 | 時間応答の再現が大事な場合 |
| 直接設計（Yule-Walker 等） | 任意形状の特性を近似できる | 最適化計算が必要 | 変則的な特性が要るとき |

→ 次: [09_実装構造と数値的注意点.md](09_実装構造と数値的注意点.md)
