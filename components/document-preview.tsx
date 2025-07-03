interface DocumentPreviewProps {
  documentId: string
  materialType: string
  content?: string
}

export function DocumentPreview({ documentId, materialType, content }: DocumentPreviewProps) {
  // 実際の実装では、documentIdとmaterialTypeに基づいてプレビューを表示する
  // ここではサンプルのプレビューを表示

  // contentが提供されている場合は、それを使用してプレビューを表示
  if (content) {
    return (
      <div className="bg-white p-6 border rounded-lg min-h-[500px]">
        <div className="prose max-w-none">
          {content.split("\n").map((line, index) => {
            if (line.startsWith("# ")) {
              return (
                <h1 key={index} className="text-xl font-bold">
                  {line.substring(2)}
                </h1>
              )
            } else if (line.startsWith("## ")) {
              return (
                <h2 key={index} className="text-lg font-semibold">
                  {line.substring(3)}
                </h2>
              )
            } else if (line.startsWith("- ")) {
              return (
                <li key={index} className="ml-5">
                  {line.substring(2)}
                </li>
              )
            } else if (line === "") {
              return <br key={index} />
            } else {
              return <p key={index}>{line}</p>
            }
          })}
        </div>
      </div>
    )
  }

  const renderPreview = () => {
    switch (materialType) {
      case "fill-in-blank":
        return (
          <div className="space-y-4">
            <h1 className="text-xl font-bold text-center">物理学基礎 - 穴埋めプリント</h1>
            <p className="text-sm text-slate-500 text-center">以下の文章の空欄に適切な言葉を入れなさい。</p>

            <div className="space-y-3 mt-6">
              <p>1. 物体に力が加わると、物体は力の方向に_____（1）する。これは_____（2）の法則として知られている。</p>
              <p>2. 物体の運動エネルギーは_____（3）に比例し、_____（4）の2乗に比例する。</p>
              <p>3. 2つの物体間に働く_____（5）は、2つの質量の積に比例し、距離の2乗に_____（6）する。</p>
              <p>4. 閉じた系において、_____（7）の総和は一定である。これは_____（8）保存の法則と呼ばれる。</p>
              <p>5. 光の_____（9）は、媒質によって変化する。これが_____（10）の原因となる。</p>
            </div>
          </div>
        )

      case "summary":
        return (
          <div className="space-y-4">
            <h1 className="text-xl font-bold text-center">物理学基礎 - まとめシート</h1>

            <div className="space-y-6 mt-6">
              <div>
                <h2 className="text-lg font-semibold border-b pb-1 mb-2">1. 力学の基本法則</h2>
                <ul className="list-disc pl-5 space-y-1">
                  <li>ニュートンの運動の第一法則（慣性の法則）</li>
                  <li>ニュートンの運動の第二法則（F = ma）</li>
                  <li>ニュートンの運動の第三法則（作用・反作用の法則）</li>
                </ul>
              </div>

              <div>
                <h2 className="text-lg font-semibold border-b pb-1 mb-2">2. エネルギーと仕事</h2>
                <ul className="list-disc pl-5 space-y-1">
                  <li>運動エネルギー: E = (1/2)mv²</li>
                  <li>位置エネルギー: E = mgh</li>
                  <li>仕事: W = F・d・cosθ</li>
                </ul>
              </div>

              <div>
                <h2 className="text-lg font-semibold border-b pb-1 mb-2">3. 万有引力</h2>
                <ul className="list-disc pl-5 space-y-1">
                  <li>万有引力の法則: F = G(m₁m₂/r²)</li>
                  <li>重力加速度: g = GM/r²</li>
                </ul>
              </div>
            </div>
          </div>
        )

      case "quiz":
        return (
          <div className="space-y-4">
            <h1 className="text-xl font-bold text-center">物理学基礎 - 小テスト</h1>
            <p className="text-sm text-slate-500 text-center">以下の問題に答えなさい。</p>

            <div className="space-y-6 mt-6">
              <div>
                <p className="font-medium">問1. 次のうち、ニュートンの第一法則を最もよく表しているのはどれか。</p>
                <div className="mt-2 space-y-1">
                  <div className="flex items-center">
                    <input type="radio" id="q1a" name="q1" className="mr-2" />
                    <label htmlFor="q1a">物体に力が加わると、加速度が生じる</label>
                  </div>
                  <div className="flex items-center">
                    <input type="radio" id="q1b" name="q1" className="mr-2" />
                    <label htmlFor="q1b">外力が働かなければ、物体は静止または等速直線運動を続ける</label>
                  </div>
                  <div className="flex items-center">
                    <input type="radio" id="q1c" name="q1" className="mr-2" />
                    <label htmlFor="q1c">作用には反作用が存在する</label>
                  </div>
                </div>
              </div>

              <div>
                <p className="font-medium">問2. 質量2kgの物体に4Nの力を加えたとき、物体の加速度は何m/s²か。</p>
                <div className="mt-2 space-y-1">
                  <div className="flex items-center">
                    <input type="radio" id="q2a" name="q2" className="mr-2" />
                    <label htmlFor="q2a">0.5 m/s²</label>
                  </div>
                  <div className="flex items-center">
                    <input type="radio" id="q2b" name="q2" className="mr-2" />
                    <label htmlFor="q2b">2 m/s²</label>
                  </div>
                  <div className="flex items-center">
                    <input type="radio" id="q2c" name="q2" className="mr-2" />
                    <label htmlFor="q2c">8 m/s²</label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return (
          <div className="flex items-center justify-center h-64">
            <p className="text-slate-500">プレビューを表示するには教材タイプを選択してください</p>
          </div>
        )
    }
  }

  return <div className="bg-white p-6 border rounded-lg min-h-[500px]">{renderPreview()}</div>
}
