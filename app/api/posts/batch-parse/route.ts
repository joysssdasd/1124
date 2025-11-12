import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { content, trade_type, contact_method } = await request.json()

    if (!content || !trade_type) {
      return NextResponse.json({
        success: false,
        message: '请提供完整信息'
      })
    }

    // 调用DeepSeek API解析文本
    const prompt = `
请将以下文本内容解析为结构化的交易信息数组。每行可能包含标题和价格信息。

解析规则：
1. 只提取包含明确价格的行
2. 价格通常以数字开头，可能包含"元"、"¥"等符号
3. 标题是价格前面的描述文字
4. 忽略无法解析的行
5. 输出JSON数组格式，每个对象包含title和price字段

原始文本：
${content}

请只输出JSON数组，不要其他说明文字。格式示例：
[
  {"title": "成都周深演唱会门票", "price": 399},
  {"title": "上海周杰伦演唱会", "price": 880}
]
`

    const deepseekResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer sk-4dac2f720dfc43a18dc3f46053a68f16`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 2000
      })
    })

    if (!deepseekResponse.ok) {
      throw new Error('AI解析服务暂时不可用')
    }

    const deepseekData = await deepseekResponse.json()
    const aiResponse = deepseekData.choices[0].message.content

    // 解析AI返回的JSON
    let parsedItems = []
    try {
      // 清理可能的markdown代码块标记
      const cleanJson = aiResponse.replace(/```json\n?|\n?```/g, '').trim()
      parsedItems = JSON.parse(cleanJson)
    } catch (parseError) {
      console.error('解析AI响应失败:', aiResponse)

      // 降级方案：简单正则解析
      const lines = content.split('\n').filter((line: string) => line.trim())
      parsedItems = lines.map((line: string) => {
        const priceMatch = line.match(/(\d+(?:\.\d+)?)/)
        if (priceMatch) {
          const price = parseFloat(priceMatch[1])
          const title = line.replace(priceMatch[0], '').replace(/[元¥￥]/g, '').trim()
          return { title: title || `商品${parsedItems.length + 1}`, price }
        }
        return null
      }).filter((item: any) => item !== null)
    }

    // 验证解析结果
    if (!Array.isArray(parsedItems) || parsedItems.length === 0) {
      return NextResponse.json({
        success: false,
        message: '未能解析出有效信息，请检查格式'
      })
    }

    // 为每个项目添加额外信息
    const enhancedItems = parsedItems.map((item: any, index: number) => ({
      ...item,
      keywords: '', // 需要用户手动填写
      trade_type: parseInt(trade_type),
      contact_method,
      extra_info: trade_type === '3' || trade_type === '4' ? '批量发布' : null
    }))

    return NextResponse.json({
      success: true,
      message: `成功解析${enhancedItems.length}条信息`,
      items: enhancedItems
    })

  } catch (error) {
    console.error('批量解析失败:', error)
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : '解析失败，请重试'
    })
  }
}