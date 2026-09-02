// AI分析内容变化生成器
// 根据出生时间生成不同的开头和结尾

export function generateSeedFromBirthInfo(userInfo, context) {
  const birthDate = userInfo.birthDate instanceof Date ? userInfo.birthDate : new Date(userInfo.birthDate);
  const year = birthDate.getFullYear();
  const month = birthDate.getMonth() + 1;
  const day = birthDate.getDate();
  const hour = birthDate.getHours();
  
  // 使用多个因素计算种子值
  const dayMasterCode = context.dayMaster?.charCodeAt(0) || 0;
  const monthBranchCode = context.monthBranch?.charCodeAt(0) || 0;
  
  // 综合种子值，确保不同的人有不同的结果
  const seed = (year * 1000 + month * 100 + day * 10 + hour + dayMasterCode + monthBranchCode) % 1000;
  
  return seed;
}

export function getPart1Variations(context, baziResult, userInfo) {
  const seed = generateSeedFromBirthInfo(userInfo, context);
  const idx = seed % 12;
  
  const variations = {
    zh: [
      `此命局必须以日主为核心来看。你的日主是 **${context.dayMaster}（${context.dayMasterElement}）**，月令落在 **${context.monthBranch}**，属 **${context.monthCommand.season}**，所以日干在月令中的状态为 **${context.monthCommand.state}**。这一步决定了后续所有判断的起点：不是先看"你像什么人"，而是先看"日主有没有拿到时令"。${baziResult.strengthAnalysis.description}`,
      `解读这个命局，首先要抓住日主这根主线。你的日主是 **${context.dayMaster}（${context.dayMasterElement}）**，出生在 **${context.monthBranch}** 月，正值 **${context.monthCommand.season}**，此时日干处于 **${context.monthCommand.state}** 状态。这是整个分析的锚点：一切判断都要从"日主得不得时"开始，而不是先贴标签。${baziResult.strengthAnalysis.description}`,
      `要理解这个命盘，必须从日主入手。你的日主是 **${context.dayMaster}（${context.dayMasterElement}）**，月令在 **${context.monthBranch}**，属于 **${context.monthCommand.season}**，日干在月令中的状态为 **${context.monthCommand.state}**。这是最关键的第一步：先搞清楚日主是否得时令之气，再说其他。${baziResult.strengthAnalysis.description}`,
      `这个命局的核心，全在日主身上。你的日主是 **${context.dayMaster}（${context.dayMasterElement}）**，生在 **${context.monthBranch}** 月，正当 **${context.monthCommand.season}**，日干此时处于 **${context.monthCommand.state}**。所有的分析都要从这里开始：不是看"你是谁"，而是看"日主拿到了什么"。${baziResult.strengthAnalysis.description}`,
      `命理分析的第一步，永远是定位日主。你的日主为 **${context.dayMaster}（${context.dayMasterElement}）**，生于 **${context.monthBranch}** 月，时值 **${context.monthCommand.season}**，故日干在月令呈 **${context.monthCommand.state}** 之态。这是解读整个命盘的钥匙：日主是否得时，决定了一切后续判断。${baziResult.strengthAnalysis.description}`,
      `看一个命局，先要看日主在什么位置。你的日主 **${context.dayMaster}（${context.dayMasterElement}）** 落于 **${context.monthBranch}** 月，正值 **${context.monthCommand.season}**，日干得月令之气而为 **${context.monthCommand.state}**。这一条，是所有分析的根基。${baziResult.strengthAnalysis.description}`,
      `八字分析，首重日主。你的日主是 **${context.dayMaster}（${context.dayMasterElement}）**，生于 **${context.monthBranch}** 月，属 **${context.monthCommand.season}**，日干在月令的状态为 **${context.monthCommand.state}**。这是判断命局强弱旺衰的出发点。${baziResult.strengthAnalysis.description}`,
      `每个人的命局都有一个核心，那就是日主。你的日主是 **${context.dayMaster}（${context.dayMasterElement}）**，月令为 **${context.monthBranch}**，时属 **${context.monthCommand.season}**，日干得令而呈 **${context.monthCommand.state}**。这是分析你命局的第一把钥匙。${baziResult.strengthAnalysis.description}`,
      `命盘解读从日主开始。你的日主 **${context.dayMaster}（${context.dayMasterElement}）** 生于 **${context.monthBranch}** 月，正当 **${context.monthCommand.season}**，日干在月令中处于 **${context.monthCommand.state}** 状态。得时与否，是一切判断的起点。${baziResult.strengthAnalysis.description}`,
      `理解命运，先理解日主。你的日主是 **${context.dayMaster}（${context.dayMasterElement}）**，生于 **${context.monthBranch}** 月，时值 **${context.monthCommand.season}**，日干在月令的状态是 **${context.monthCommand.state}**。这是命局分析的根本立足点。${baziResult.strengthAnalysis.description}`,
      `命理之道，首辨日主。你的日主为 **${context.dayMaster}（${context.dayMasterElement}）**，月令坐 **${context.monthBranch}**，属 **${context.monthCommand.season}**，日干得月令之气而为 **${context.monthCommand.state}**。这是整个命局分析的基石。${baziResult.strengthAnalysis.description}`,
      `八字之学，日主为尊。你的日主 **${context.dayMaster}（${context.dayMasterElement}）** 生于 **${context.monthBranch}** 月，正值 **${context.monthCommand.season}**，日干在月令呈 **${context.monthCommand.state}** 之象。这是解读你命局的第一步。${baziResult.strengthAnalysis.description}`
    ]
  };
  
  return variations.zh[idx];
}

export function getPart2Variations(context, userInfo) {
  const seed = generateSeedFromBirthInfo(userInfo, context);
  const idx = (seed + 3) % 12;
  
  const variations = {
    zh: [
      `你的性格底色不是一句"坚毅"就能概括，而是由"日干 + 月令状态"直接推出来的：${context.personalityBase}。再看藏干透出，当前明显被引到台前的线索是 ${context.exposedHiddenStems.length ? context.exposedHiddenStems.map(item => `${item.stem}-${item.relation}`).join('、') : '暂未形成强透出'}，这意味着你的潜能不是散着用，而是会更集中地落在"${context.potentialDirection.text}"这一类路径上。换句话说，你真正能做深的，不是所有事情，而是那些能让隐藏能量被持续调动的领域。`,
      `不要用简单的标签定义你的性格。你的性格底色，其实是"日干 + 月令"的直接呈现：${context.personalityBase}。而从藏干透出的线索来看，${context.exposedHiddenStems.length ? context.exposedHiddenStems.map(item => `${item.stem}-${item.relation}`).join('、') : '暂未形成强透出'} 是被引到台前的重点，这说明你的潜能最适合在"${context.potentialDirection.text}"这类方向上深耕。那些能持续激活你隐藏能量的事情，才是你真正能做好的。`,
      `你的性格没有那么简单，不能用一两个词就概括。从日干和月令的组合来看：${context.personalityBase}。而藏干透出的情况显示，${context.exposedHiddenStems.length ? context.exposedHiddenStems.map(item => `${item.stem}-${item.relation}`).join('、') : '暂未形成强透出'} 正在被调动，这意味着你的潜能会在"${context.potentialDirection.text}"这类领域里更容易发挥。找到那些能让你内在能量持续流动的事，才是真正的方向。`,
      `理解你的性格，要从日干在月令中的状态入手：${context.personalityBase}。这不是一句空话，而是真实的能量状态。再看藏干透出，${context.exposedHiddenStems.length ? context.exposedHiddenStems.map(item => `${item.stem}-${item.relation}`).join('、') : '暂未形成强透出'} 是浮在表面的线索，说明你的潜能适合在"${context.potentialDirection.text}"这样的路径上发展。能让你内在力量持续发挥的事，才是你真正的舞台。`,
      `性格不是天生的标签，而是日干与月令相互作用的产物：${context.personalityBase}。藏干透出的线索——${context.exposedHiddenStems.length ? context.exposedHiddenStems.map(item => `${item.stem}-${item.relation}`).join('、') : '暂未形成强透出'}——揭示了你的潜能指向"${context.potentialDirection.text}"。那些能让你的隐藏能量持续被激活的领域，才是你真正应该深耕的方向。`,
      `你的性格底色，源于日干在月令中的状态：${context.personalityBase}。藏干中透出的${context.exposedHiddenStems.length ? context.exposedHiddenStems.map(item => `${item.stem}-${item.relation}`).join('、') : '暂未形成强透出'}，是你潜能的外显线索，指向"${context.potentialDirection.text}"这一发展方向。找到能持续调动你内在能量的事情，才能让潜能真正发挥。`,
      `性格的形成，与日干月令息息相关：${context.personalityBase}。从藏干透出来看，${context.exposedHiddenStems.length ? context.exposedHiddenStems.map(item => `${item.stem}-${item.relation}`).join('、') : '暂未形成强透出'} 是被激活的线索，你的潜能最适合在"${context.potentialDirection.text}"这类领域发展。能让你内在能量持续流动的事，才是你真正的优势所在。`,
      `每个人的性格都有其独特的能量结构。你的性格底色由日干月令决定：${context.personalityBase}。藏干中${context.exposedHiddenStems.length ? context.exposedHiddenStems.map(item => `${item.stem}-${item.relation}`).join('、') : '暂未形成强透出'}的透出，意味着你的潜能会集中在"${context.potentialDirection.text}"这类方向上。那些能持续激发你内在力量的事，才是你真正擅长的。`,
      `性格分析要从能量入手。你的性格底色是：${context.personalityBase}。藏干透出的线索${context.exposedHiddenStems.length ? context.exposedHiddenStems.map(item => `${item.stem}-${item.relation}`).join('、') : '暂未形成强透出'}，指向你的潜能方向——"${context.potentialDirection.text}"。找到能让你内在能量持续发挥的领域，才是成功的关键。`,
      `你的性格，是日干与月令共同塑造的结果：${context.personalityBase}。藏干中透出的${context.exposedHiddenStems.length ? context.exposedHiddenStems.map(item => `${item.stem}-${item.relation}`).join('、') : '暂未形成强透出'}，是你潜能的外在表现，最适合在"${context.potentialDirection.text}"这类方向上发展。能持续激活你隐藏能量的事情，才是你真正应该投入的领域。`,
      `性格的本质是能量的表达。你的性格底色：${context.personalityBase}。藏干透出${context.exposedHiddenStems.length ? context.exposedHiddenStems.map(item => `${item.stem}-${item.relation}`).join('、') : '暂未形成强透出'}，揭示了你的潜能指向"${context.potentialDirection.text}"。那些能让你的内在力量持续流动的事情，才是你真正的优势。`,
      `性格不是抽象的概念，而是具体的能量状态：${context.personalityBase}。从藏干透出来看，${context.exposedHiddenStems.length ? context.exposedHiddenStems.map(item => `${item.stem}-${item.relation}`).join('、') : '暂未形成强透出'}是被激活的线索，你的潜能最适合在"${context.potentialDirection.text}"这类领域深耕。找到能持续调动你内在能量的事，才能让潜能真正释放。`
    ]
  };
  
  return variations.zh[idx];
}

export function getPart3Variations(context, extraData, userInfo) {
  const { daYunRelationText, wealthOpportunity, wealthRisk } = extraData;
  const seed = generateSeedFromBirthInfo(userInfo, context);
  const idx = (seed + 7) % 12;
  
  const variations = {
    zh: [
      `此命的财星五行为 **${context.wealthElement}**。当前大运 **${context.daYunAnalysis.ganZhi || '未进入可识别大运'}** 对日主总体呈 **${context.daYunAnalysis.trend}**，并与原局形成 ${daYunRelationText}。${wealthOpportunity} ${wealthRisk} 如果你今年要做求财动作，优先考虑"已有客户、已有技能、已有渠道"的二次放大，而不是临时切赛道或听消息追热点。`,
      `财星在这个命局中是 **${context.wealthElement}**。眼下大运 **${context.daYunAnalysis.ganZhi || '未进入可识别大运'}** 对日主的整体影响是 **${context.daYunAnalysis.trend}**，同时与原局形成 ${daYunRelationText}。${wealthOpportunity} ${wealthRisk} 今年求财，最好的策略是深耕已有资源，而不是贸然进入陌生领域。`,
      `这个命局的财星属 **${context.wealthElement}**。当前大运 **${context.daYunAnalysis.ganZhi || '未进入可识别大运'}** 对日主呈 **${context.daYunAnalysis.trend}**，与原局之间有 ${daYunRelationText} 的作用。${wealthOpportunity} ${wealthRisk} 求财一事，今年更适合在已有基础上做增量，而不是从零开始。`,
      `你的财星是 **${context.wealthElement}**。现在走的大运 **${context.daYunAnalysis.ganZhi || '未进入可识别大运'}** 对日主总体是 **${context.daYunAnalysis.trend}**，且与原局形成 ${daYunRelationText}。${wealthOpportunity} ${wealthRisk} 今年求财，要稳扎稳打，在已有客户、技能和渠道的基础上放大，别轻易换赛道。`,
      `财星为 **${context.wealthElement}**，是你命局中的财富密码。当前大运 **${context.daYunAnalysis.ganZhi || '未进入可识别大运'}** 对日主的影响是 **${context.daYunAnalysis.trend}**，与原局形成${daYunRelationText}的关系。${wealthOpportunity} ${wealthRisk} 今年求财，宜深耕已有资源，不宜盲目扩张。`,
      `命局中的财星是 **${context.wealthElement}**。大运 **${context.daYunAnalysis.ganZhi || '未进入可识别大运'}** 正在以 **${context.daYunAnalysis.trend}** 的方式影响日主，同时与原局产生 ${daYunRelationText} 的互动。${wealthOpportunity} ${wealthRisk} 求财之道，在于稳中求进，而非冒险投机。`,
      `你的财星五行属 **${context.wealthElement}**。当前大运 **${context.daYunAnalysis.ganZhi || '未进入可识别大运'}** 对日主呈 **${context.daYunAnalysis.trend}** 之势，与原局形成 ${daYunRelationText}。${wealthOpportunity} ${wealthRisk} 今年财运，适合在已有基础上深耕，而非另起炉灶。`,
      `财星代表你的财富潜能，五行属 **${context.wealthElement}**。大运 **${context.daYunAnalysis.ganZhi || '未进入可识别大运'}** 对日主的影响为 **${context.daYunAnalysis.trend}**，与原局的互动是 ${daYunRelationText}。${wealthOpportunity} ${wealthRisk} 求财要顺势而为，不要逆势而动。`,
      `此命财星为 **${context.wealthElement}**。大运 **${context.daYunAnalysis.ganZhi || '未进入可识别大运'}** 正在 **${context.daYunAnalysis.trend}** 日主，与原局形成 ${daYunRelationText} 的关系。${wealthOpportunity} ${wealthRisk} 今年求财，重在稳健，不在冒进。`,
      `你的财星是 **${context.wealthElement}**，代表你的财富方向。当前大运 **${context.daYunAnalysis.ganZhi || '未进入可识别大运'}** 对日主呈 **${context.daYunAnalysis.trend}**，与原局之间有 ${daYunRelationText} 的作用。${wealthOpportunity} ${wealthRisk} 求财要脚踏实地，不要好高骛远。`,
      `命局财星属 **${context.wealthElement}**。大运 **${context.daYunAnalysis.ganZhi || '未进入可识别大运'}** 对日主的影响是 **${context.daYunAnalysis.trend}**，与原局形成 ${daYunRelationText}。${wealthOpportunity} ${wealthRisk} 今年财运，宜守不宜攻，宜稳不宜急。`,
      `财星 **${context.wealthElement}** 是你命局中的财富密码。大运 **${context.daYunAnalysis.ganZhi || '未进入可识别大运'}** 正以 **${context.daYunAnalysis.trend}** 的方式作用于日主，与原局产生 ${daYunRelationText} 的互动。${wealthOpportunity} ${wealthRisk} 求财之道，在于顺势而为，深耕已有。`
    ]
  };
  
  return variations.zh[idx];
}

export function getPart4Variations(context, extraData, userInfo) {
  const { liuNianRelationText } = extraData;
  const seed = generateSeedFromBirthInfo(userInfo, context);
  const idx = (seed + 5) % 12;
  
  const variations = {
    zh: [
      `当前流年是 **${context.liuNianAnalysis.ganZhi}**，与原局之间出现 ${liuNianRelationText}。若流年、生扶在前，行动重点是把握窗口、集中资源、让专业输出先变成信用，再变成现金流；若流年、克泄在前，行动重点就是收杠杆、慢签约、重审查、避冲动。所有建议都要回到一个问题：日主能不能承住月令、大运、流年三层压力。如果承得住，可以扩；承不住，就先补身再取财。`,
      `今年流年是 **${context.liuNianAnalysis.ganZhi}**，与原局的作用关系是 ${liuNianRelationText}。如果流年是生扶日主的，要抓住机会、集中资源、把专业能力先转化成口碑，再变成收入；如果流年是克泄日主的，就要稳扎稳打、不要急着签约、多做审查、避免冲动决策。核心只有一个：日主能不能扛住月令、大运、流年这三层压力。扛得住就可以扩张，扛不住就先固本。`,
      `流年走到 **${context.liuNianAnalysis.ganZhi}**，与原局形成 ${liuNianRelationText}。如果流年对日主是帮扶的，重点是把握时机、集中资源、让你的专业输出先积累信用，再转化为现金流；如果流年对日主是克制的，就要减少风险、放慢签约节奏、严格审查、避免冲动。所有行动都要回到这个根本问题：日主能不能同时承受月令、大运、流年的压力。能承受就扩张，不能就先夯实基础。`,
      `现在的流年是 **${context.liuNianAnalysis.ganZhi}**，与原局有 ${liuNianRelationText} 的关系。流年生扶时，要抓住窗口、集中资源、用专业能力建立信用，再变成收入；流年克泄时，要降低杠杆、不急于签约、仔细审查、避免冲动。关键看日主能不能承住月令、大运、流年这三层压力。承得住就发展，承不住就先稳固。`,
      `流年 **${context.liuNianAnalysis.ganZhi}** 与原局的互动是 ${liuNianRelationText}。流年帮扶日主时，要把握时机、集中资源、让专业能力先变成口碑再变成收入；流年克泄日主时，要稳扎稳打、仔细审查、避免冲动决策。关键问题是：日主能否承受月令、大运、流年三层压力？能承受就扩张，不能就先固本培元。`,
      `今年是 **${context.liuNianAnalysis.ganZhi}** 年，与原局形成 ${liuNianRelationText} 的关系。若流年生扶日主，行动重点是把握窗口、集中资源、让专业输出变成信用和现金流；若流年克泄日主，就要收杠杆、慢签约、重审查、避冲动。核心问题：日主能否扛住月令、大运、流年三层压力？能扛就扩张，不能就先补身。`,
      `流年 **${context.liuNianAnalysis.ganZhi}** 与命局的互动为 ${liuNianRelationText}。流年帮扶时，要抓住机会、集中资源、让专业能力变成口碑和收入；流年克泄时，要稳扎稳打、仔细审查、避免冲动。关键看日主能否承受月令、大运、流年三层压力。能承受就发展，不能就先夯实基础。`,
      `当前流年 **${context.liuNianAnalysis.ganZhi}** 与原局的作用是 ${liuNianRelationText}。流年生扶时，要把握窗口、集中资源、让专业输出变成信用和现金流；流年克泄时，要降低杠杆、仔细审查、避免冲动。核心问题：日主能否扛住月令、大运、流年三层压力？能扛就扩张，不能就先稳固。`,
      `流年 **${context.liuNianAnalysis.ganZhi}** 正在与原局产生 ${liuNianRelationText} 的互动。流年帮扶日主时，要把握时机、集中资源、让专业能力变成口碑和收入；流年克泄日主时，要稳扎稳打、仔细审查、避免冲动。关键问题：日主能否承受月令、大运、流年三层压力？能承受就扩张，不能就先补身。`,
      `今年流年 **${context.liuNianAnalysis.ganZhi}** 与原局形成 ${liuNianRelationText}。流年生扶时，要抓住窗口、集中资源、让专业输出变成信用和现金流；流年克泄时，要收杠杆、慢签约、重审查、避冲动。核心问题：日主能否扛住月令、大运、流年三层压力？能扛就发展，不能就先固本。`,
      `流年 **${context.liuNianAnalysis.ganZhi}** 与命局的关系是 ${liuNianRelationText}。流年帮扶时，要把握机会、集中资源、让专业能力变成口碑和收入；流年克泄时，要稳扎稳打、仔细审查、避免冲动。关键看日主能否承受月令、大运、流年三层压力。能承受就扩张，不能就先夯实基础。`,
      `当前流年 **${context.liuNianAnalysis.ganZhi}** 与原局的互动为 ${liuNianRelationText}。流年生扶日主时，要把握窗口、集中资源、让专业输出变成信用和现金流；流年克泄日主时，要降低杠杆、仔细审查、避免冲动。核心问题：日主能否扛住月令、大运、流年三层压力？能扛就扩张，不能就先稳固。`
    ]
  };
  
  return variations.zh[idx];
}

export function getPart5Variations(context, userInfo) {
  const seed = generateSeedFromBirthInfo(userInfo, context);
  const idx = (seed + 11) % 12;
  
  const variations = {
    zh: [
      `你真正要处理的，不是抽象的"运气好不好"，而是月令如何定了日干的底色，大运与流年又怎样把这个底色推向放大、碰撞或耗损。`,
      `这一年的核心，不是空泛的"命运如何"，而是要看月令给你的基础是什么，大运和流年又会把这个基础带向何方——是放大、是碰撞，还是消耗。`,
      `你要面对的，从来不是"运气好坏"这种抽象的说法，而是月令确定了你是什么样的底子，大运流年又会如何作用于这个底子——是让它更强大，还是让它经受考验。`,
      `关键不在于"运气好不好"这种模糊的判断，而在于理解月令如何塑造了你的基础，大运流年又会如何影响这个基础——是推动它发展，还是让它经历挑战。`,
      `命运的核心，不是玄虚的"好坏"，而是月令给了你什么底色，大运流年又如何作用于这个底色——是放大你的优势，还是让你在挑战中成长。`,
      `你要关注的，不是"运气"这种模糊概念，而是月令如何定了你的根基，大运流年又怎样影响这个根基——是助你发展，还是让你在磨砺中进步。`,
      `命运的真相，不是简单的"吉凶"，而是月令塑造了你的底色，大运流年又如何与这个底色互动——是放大你的能量，还是让你在考验中蜕变。`,
      `关键在于理解：月令给了你什么样的起点，大运流年又如何作用于这个起点——是推动你前进，还是让你在挑战中积累力量。`,
      `命运的本质，不是"运气好坏"的标签，而是月令定了你的底子，大运流年又如何影响这个底子——是让你更强大，还是让你在历练中成长。`,
      `你要把握的，不是抽象的"命运"，而是月令如何塑造了你，大运流年又怎样作用于你——是放大你的潜能，还是让你在挑战中突破。`,
      `命运的密码，不是"吉凶"二字，而是月令给了你什么底色，大运流年又如何与这个底色互动——是助你发展，还是让你在考验中升华。`,
      `核心问题在于：月令如何定了你的根基，大运流年又怎样影响这个根基——是推动你向前，还是让你在挑战中变得更强大。`
    ]
  };
  
  return variations.zh[idx];
}

// 英文版本
export function getPart1VariationsEn(context, baziResult, userInfo, sanitizeEnglishText) {
  const seed = generateSeedFromBirthInfo(userInfo, context);
  const idx = seed % 12;
  
  const variations = [
    `Your Day Master is **${sanitizeEnglishText(context.dayMaster)} (${sanitizeEnglishText(context.dayMasterElement)})**. The Month Command sits in **${sanitizeEnglishText(context.monthBranch)}**, which belongs to **${sanitizeEnglishText(context.monthCommand.season)}**, so the Day Master falls into the state of **${sanitizeEnglishText(context.monthCommand.state)}**. This means the core engine of the chart is not judged by slogans, but by whether the seasonal qi is empowering or suppressing the Day Master.`,
    `To read this chart, start with the Day Master. Your Day Master is **${sanitizeEnglishText(context.dayMaster)} (${sanitizeEnglishText(context.dayMasterElement)})**, born in the month of **${sanitizeEnglishText(context.monthBranch)}** during **${sanitizeEnglishText(context.monthCommand.season)}**, placing the Day Master in a **${sanitizeEnglishText(context.monthCommand.state)}** state. This is the anchor: all interpretation begins with whether the Day Master receives seasonal support, not with labels.`,
    `The core of this chart is the Day Master. Yours is **${sanitizeEnglishText(context.dayMaster)} (${sanitizeEnglishText(context.dayMasterElement)})**, born in **${sanitizeEnglishText(context.monthBranch)}** month, part of **${sanitizeEnglishText(context.monthCommand.season)}**, so the Day Master is in a **${sanitizeEnglishText(context.monthCommand.state)}** condition. This is the first step: understand if the Day Master has seasonal qi before anything else.`,
    `This chart revolves around the Day Master. Yours is **${sanitizeEnglishText(context.dayMaster)} (${sanitizeEnglishText(context.dayMasterElement)})**, born in **${sanitizeEnglishText(context.monthBranch)}** during **${sanitizeEnglishText(context.monthCommand.season)}**, making the Day Master **${sanitizeEnglishText(context.monthCommand.state)}**. All analysis starts here: not with who you are, but with what the Day Master receives.`,
    `The first step in reading any chart is locating the Day Master. Yours is **${sanitizeEnglishText(context.dayMaster)} (${sanitizeEnglishText(context.dayMasterElement)})**, born in **${sanitizeEnglishText(context.monthBranch)}** month during **${sanitizeEnglishText(context.monthCommand.season)}**, placing it in a **${sanitizeEnglishText(context.monthCommand.state)}** state. This is the key to understanding the entire chart.`,
    `To understand your destiny, we begin with the Day Master. Your Day Master **${sanitizeEnglishText(context.dayMaster)} (${sanitizeEnglishText(context.dayMasterElement)})** was born in **${sanitizeEnglishText(context.monthBranch)}** month, during **${sanitizeEnglishText(context.monthCommand.season)}**, and is in a **${sanitizeEnglishText(context.monthCommand.state)}** state. This is the foundation of all analysis.`,
    `Every chart has a center, and yours is the Day Master **${sanitizeEnglishText(context.dayMaster)} (${sanitizeEnglishText(context.dayMasterElement)})**. Born in **${sanitizeEnglishText(context.monthBranch)}** month during **${sanitizeEnglishText(context.monthCommand.season)}**, it sits in a **${sanitizeEnglishText(context.monthCommand.state)}** state. This determines everything that follows.`,
    `The Day Master is the heart of any reading. Yours is **${sanitizeEnglishText(context.dayMaster)} (${sanitizeEnglishText(context.dayMasterElement)})**, born in **${sanitizeEnglishText(context.monthBranch)}** during **${sanitizeEnglishText(context.monthCommand.season)}**, placing it in **${sanitizeEnglishText(context.monthCommand.state)}** condition. This is where all interpretation begins.`,
    `Destiny analysis starts with the Day Master. Your Day Master **${sanitizeEnglishText(context.dayMaster)} (${sanitizeEnglishText(context.dayMasterElement)})** is born in **${sanitizeEnglishText(context.monthBranch)}** month, during **${sanitizeEnglishText(context.monthCommand.season)}**, and is currently **${sanitizeEnglishText(context.monthCommand.state)}**. This is the foundation of your chart.`,
    `The key to understanding your chart is the Day Master. Yours is **${sanitizeEnglishText(context.dayMaster)} (${sanitizeEnglishText(context.dayMasterElement)})**, born in **${sanitizeEnglishText(context.monthBranch)}** during **${sanitizeEnglishText(context.monthCommand.season)}**, sitting in a **${sanitizeEnglishText(context.monthCommand.state)}** state. This is the starting point of all analysis.`,
    `Your chart centers on the Day Master **${sanitizeEnglishText(context.dayMaster)} (${sanitizeEnglishText(context.dayMasterElement)})**. Born in **${sanitizeEnglishText(context.monthBranch)}** month during **${sanitizeEnglishText(context.monthCommand.season)}**, it is in a **${sanitizeEnglishText(context.monthCommand.state)}** state. This is the foundation upon which all else is built.`,
    `To decode your destiny, we look first at the Day Master. Your Day Master **${sanitizeEnglishText(context.dayMaster)} (${sanitizeEnglishText(context.dayMasterElement)})** was born in **${sanitizeEnglishText(context.monthBranch)}** during **${sanitizeEnglishText(context.monthCommand.season)}**, and is **${sanitizeEnglishText(context.monthCommand.state)}**. This is the key that unlocks your chart.`
  ];
  
  return variations[idx];
}

export function getPart2VariationsEn(context, userInfo, PERSONALITY_BASE_EN, sanitizeEnglishText, englishExposedHiddenStems) {
  const seed = generateSeedFromBirthInfo(userInfo, context);
  const idx = (seed + 3) % 12;
  
  const variations = [
    `The core personality does not come from abstract labels. It comes from the combination of Day Master and Month Command. In this chart, ${PERSONALITY_BASE_EN[context.dayMasterElement]?.[context.monthCommand.state] || 'the temperament is best understood through seasonal support, inner restraint, and how the Day Master receives pressure.'} Hidden stems that are actually echoed by visible stems are ${englishExposedHiddenStems}, so your potential is more likely to unfold through ${context.potentialDirection.englishText}. In other words, your talent grows best when it is placed in a structure that matches the way your hidden qi is being drawn out.`,
    `Don't box yourself in with simple labels. Your personality emerges directly from how your Day Master interacts with the Month Command: ${PERSONALITY_BASE_EN[context.dayMasterElement]?.[context.monthCommand.state] || 'the temperament reveals itself through seasonal dynamics, internal structure, and how pressure is managed.'} The hidden stems that surface through visible stems are ${englishExposedHiddenStems}, meaning your potential will most naturally unfold through ${context.potentialDirection.englishText}. The areas that continuously activate your hidden energy are where you will truly excel.`,
    `Your personality is more complex than any single label. It comes from the interplay between Day Master and Month Command: ${PERSONALITY_BASE_EN[context.dayMasterElement]?.[context.monthCommand.state] || 'character is shaped by seasonal support, internal constraints, and how the Day Master handles external forces.'} The hidden stems showing through are ${englishExposedHiddenStems}, so your potential aligns best with ${context.potentialDirection.englishText}. The things that keep your inner energy flowing are where you will find your greatest strength.`,
    `Understanding your personality starts with the Day Master in its month: ${PERSONALITY_BASE_EN[context.dayMasterElement]?.[context.monthCommand.state] || 'temperament is revealed through seasonal timing, inner structure, and how pressure is received.'} The visible echoes of hidden stems are ${englishExposedHiddenStems}, meaning your potential naturally expresses through ${context.potentialDirection.englishText}. What matters is finding contexts that let your inner energy work consistently.`,
    `Your personality is not defined by simple words. It emerges from the dance between Day Master and Month Command: ${PERSONALITY_BASE_EN[context.dayMasterElement]?.[context.monthCommand.state] || 'temperament is shaped by the seasons, internal balance, and how the Day Master responds to pressure.'} The hidden stems surfacing are ${englishExposedHiddenStems}, pointing your potential toward ${context.potentialDirection.englishText}. Your true strength lies where your inner energy flows consistently.`,
    `Personality is not a label but an energy pattern. Your pattern comes from Day Master and Month Command: ${PERSONALITY_BASE_EN[context.dayMasterElement]?.[context.monthCommand.state] || 'character emerges from seasonal timing, inner structure, and pressure response.'} The hidden stems ${englishExposedHiddenStems} reveal where your potential lies—${context.potentialDirection.englishText}. What activates your inner energy consistently is where you thrive.`,
    `Your character is built on the foundation of Day Master and Month Command: ${PERSONALITY_BASE_EN[context.dayMasterElement]?.[context.monthCommand.state] || 'temperament flows from seasonal support, internal balance, and how pressure is handled.'} The visible hidden stems ${englishExposedHiddenStems} show your potential direction—${context.potentialDirection.englishText}. Your greatest success comes from activities that keep your inner energy flowing.`,
    `Personality is energy expressed. Your energy pattern: ${PERSONALITY_BASE_EN[context.dayMasterElement]?.[context.monthCommand.state] || 'temperament is shaped by the seasons, inner structure, and how you respond to external forces.'} The hidden stems ${englishExposedHiddenStems} point toward ${context.potentialDirection.englishText} as your potential direction. What keeps your inner fire burning is where you will excel.`,
    `Your personality foundation comes from Day Master and Month Command interaction: ${PERSONALITY_BASE_EN[context.dayMasterElement]?.[context.monthCommand.state] || 'character is built on seasonal timing, inner balance, and pressure response.'} The surfacing hidden stems ${englishExposedHiddenStems} indicate your potential in ${context.potentialDirection.englishText}. Where your inner energy flows freely, there lies your true strength.`,
    `Character is not abstract—it is concrete energy. Your energy signature: ${PERSONALITY_BASE_EN[context.dayMasterElement]?.[context.monthCommand.state] || 'temperament emerges from seasonal support, internal structure, and how pressure is received.'} The hidden stems ${englishExposedHiddenStems} reveal your potential path—${context.potentialDirection.englishText}. Activities that sustain your inner energy are your key to success.`,
    `Your personality is the expression of your energy structure: ${PERSONALITY_BASE_EN[context.dayMasterElement]?.[context.monthCommand.state] || 'character flows from the seasons, inner balance, and how you handle pressure.'} The visible hidden stems ${englishExposedHiddenStems} point to ${context.potentialDirection.englishText} as your direction. What keeps your inner power flowing is where you truly belong.`,
    `Personality is the face of your inner energy. Your energy pattern: ${PERSONALITY_BASE_EN[context.dayMasterElement]?.[context.monthCommand.state] || 'temperament is shaped by seasonal timing, internal structure, and pressure response.'} The hidden stems ${englishExposedHiddenStems} indicate your potential in ${context.potentialDirection.englishText}. Your true path is where your inner energy sustains itself naturally.`
  ];
  
  return variations[idx];
}

export function getPart3VariationsEn(context, extraData, userInfo, sanitizeEnglishText) {
  const { englishDaYunRelationText, englishWealthOpportunity, englishWealthRisk } = extraData;
  const seed = generateSeedFromBirthInfo(userInfo, context);
  const idx = (seed + 7) % 12;
  
  const variations = [
    `The Wealth element for this chart is **${sanitizeEnglishText(context.wealthElement)}**. Current DaYun **${sanitizeEnglishText(context.daYunAnalysis.ganZhi || 'N/A')}** acts on the Day Master as **${sanitizeEnglishText(context.daYunAnalysis.trend)}**, while the branch side forms ${englishDaYunRelationText}. ${englishWealthOpportunity} ${englishWealthRisk}`,
    `Your Wealth element is **${sanitizeEnglishText(context.wealthElement)}**. The current DaYun **${sanitizeEnglishText(context.daYunAnalysis.ganZhi || 'N/A')}** influences the Day Master with a **${sanitizeEnglishText(context.daYunAnalysis.trend)}** tendency, while the branch creates ${englishDaYunRelationText}. ${englishWealthOpportunity} ${englishWealthRisk}`,
    `Wealth in this chart is connected to **${sanitizeEnglishText(context.wealthElement)}**. The current DaYun **${sanitizeEnglishText(context.daYunAnalysis.ganZhi || 'N/A')}** brings a **${sanitizeEnglishText(context.daYunAnalysis.trend)}** influence to the Day Master, with branch interactions showing ${englishDaYunRelationText}. ${englishWealthOpportunity} ${englishWealthRisk}`,
    `The Wealth element here is **${sanitizeEnglishText(context.wealthElement)}**. The current DaYun **${sanitizeEnglishText(context.daYunAnalysis.ganZhi || 'N/A')}** affects the Day Master as **${sanitizeEnglishText(context.daYunAnalysis.trend)}**, while the branch side forms ${englishDaYunRelationText}. ${englishWealthOpportunity} ${englishWealthRisk}`,
    `Your Wealth Star is **${sanitizeEnglishText(context.wealthElement)}**, the key to your financial potential. Current DaYun **${sanitizeEnglishText(context.daYunAnalysis.ganZhi || 'N/A')}** influences the Day Master with **${sanitizeEnglishText(context.daYunAnalysis.trend)}** energy, while forming ${englishDaYunRelationText} with the natal chart. ${englishWealthOpportunity} ${englishWealthRisk}`,
    `The Wealth element **${sanitizeEnglishText(context.wealthElement)}** represents your financial path. DaYun **${sanitizeEnglishText(context.daYunAnalysis.ganZhi || 'N/A')}** currently exerts a **${sanitizeEnglishText(context.daYunAnalysis.trend)}** influence on the Day Master, with branch interactions of ${englishDaYunRelationText}. ${englishWealthOpportunity} ${englishWealthRisk}`,
    `Your chart's Wealth element is **${sanitizeEnglishText(context.wealthElement)}**. The ongoing DaYun **${sanitizeEnglishText(context.daYunAnalysis.ganZhi || 'N/A')}** affects the Day Master in a **${sanitizeEnglishText(context.daYunAnalysis.trend)}** manner, creating ${englishDaYunRelationText} in the branches. ${englishWealthOpportunity} ${englishWealthRisk}`,
    `Wealth in your chart is represented by **${sanitizeEnglishText(context.wealthElement)}**. Current DaYun **${sanitizeEnglishText(context.daYunAnalysis.ganZhi || 'N/A')}** brings **${sanitizeEnglishText(context.daYunAnalysis.trend)}** energy to the Day Master, with branch patterns of ${englishDaYunRelationText}. ${englishWealthOpportunity} ${englishWealthRisk}`,
    `The Wealth Star **${sanitizeEnglishText(context.wealthElement)}** is your financial compass. DaYun **${sanitizeEnglishText(context.daYunAnalysis.ganZhi || 'N/A')}** currently has a **${sanitizeEnglishText(context.daYunAnalysis.trend)}** effect on the Day Master, forming ${englishDaYunRelationText} in the branches. ${englishWealthOpportunity} ${englishWealthRisk}`,
    `Your financial potential is linked to **${sanitizeEnglishText(context.wealthElement)}**. The current DaYun **${sanitizeEnglishText(context.daYunAnalysis.ganZhi || 'N/A')}** influences the Day Master with **${sanitizeEnglishText(context.daYunAnalysis.trend)}** energy, creating ${englishDaYunRelationText} patterns. ${englishWealthOpportunity} ${englishWealthRisk}`,
    `Wealth flows through **${sanitizeEnglishText(context.wealthElement)}** in your chart. DaYun **${sanitizeEnglishText(context.daYunAnalysis.ganZhi || 'N/A')}** currently exerts **${sanitizeEnglishText(context.daYunAnalysis.trend)}** influence on the Day Master, with branch interactions of ${englishDaYunRelationText}. ${englishWealthOpportunity} ${englishWealthRisk}`,
    `The element **${sanitizeEnglishText(context.wealthElement)}** governs wealth in your chart. Current DaYun **${sanitizeEnglishText(context.daYunAnalysis.ganZhi || 'N/A')}** affects the Day Master with **${sanitizeEnglishText(context.daYunAnalysis.trend)}** energy, forming ${englishDaYunRelationText} patterns. ${englishWealthOpportunity} ${englishWealthRisk}`
  ];
  
  return variations[idx];
}

export function getPart4VariationsEn(context, extraData, userInfo, sanitizeEnglishText) {
  const { englishLiuNianRelationText } = extraData;
  const seed = generateSeedFromBirthInfo(userInfo, context);
  const idx = (seed + 5) % 12;
  
  const variations = [
    `Current LiuNian is **${sanitizeEnglishText(context.liuNianAnalysis.ganZhi)}**. Its branch interactions with the natal chart are ${englishLiuNianRelationText}. If the year supports the Day Master, act by expanding the channel where you already have evidence and conversion. If the year drains or clashes, reduce leverage, slow down emotional decisions, and use documentation, budgeting, and checkpoint-based execution to avoid structural losses.`,
    `This year's LiuNian is **${sanitizeEnglishText(context.liuNianAnalysis.ganZhi)}**, creating branch interactions of ${englishLiuNianRelationText} with your natal chart. When the year supports the Day Master, focus on seizing windows, concentrating resources, and converting professional output into credibility first, then cash flow. When the year drains or clashes, reduce risk, pause on major commitments, increase review, and avoid impulsive moves.`,
    `The LiuNian now is **${sanitizeEnglishText(context.liuNianAnalysis.ganZhi)}**, interacting with your natal chart through ${englishLiuNianRelationText}. If the year strengthens the Day Master, seize the moment, focus resources, and build credibility through professional work before seeking financial returns. If the year weakens or clashes, reduce exposure, slow down signings, increase scrutiny, and avoid impulsive decisions.`,
    `We're in the LiuNian of **${sanitizeEnglishText(context.liuNianAnalysis.ganZhi)}**, with branch interactions ${englishLiuNianRelationText} with the natal chart. When the year supports, focus on windows, concentration, and converting expertise into trust first, then income. When the year challenges, reduce leverage, don't rush into agreements, review carefully, and avoid impulsiveness.`,
    `The current year **${sanitizeEnglishText(context.liuNianAnalysis.ganZhi)}** interacts with your chart through ${englishLiuNianRelationText}. When the year supports the Day Master, seize opportunities, concentrate resources, and convert professional output into credibility and cash flow. When it challenges, reduce risk, slow down commitments, and increase scrutiny.`,
    `This LiuNian **${sanitizeEnglishText(context.liuNianAnalysis.ganZhi)}** creates ${englishLiuNianRelationText} patterns with your natal chart. If the year strengthens you, focus on windows of opportunity and converting expertise into trust and income. If it challenges, reduce leverage, avoid rushing agreements, and maintain careful review.`,
    `Year **${sanitizeEnglishText(context.liuNianAnalysis.ganZhi)}** brings ${englishLiuNianRelationText} interactions to your chart. When supported, concentrate resources and convert professional output into credibility. When challenged, reduce exposure, slow down decisions, and maintain careful oversight.`,
    `The LiuNian **${sanitizeEnglishText(context.liuNianAnalysis.ganZhi)}** forms ${englishLiuNianRelationText} with your natal chart. In supportive periods, seize windows and convert expertise into trust. In challenging periods, reduce leverage, avoid hasty agreements, and increase review.`,
    `Current year **${sanitizeEnglishText(context.liuNianAnalysis.ganZhi)}** interacts through ${englishLiuNianRelationText}. When the year supports, expand channels where you have evidence. When it challenges, reduce leverage, slow emotional decisions, and use structured execution.`,
    `LiuNian **${sanitizeEnglishText(context.liuNianAnalysis.ganZhi)}** creates ${englishLiuNianRelationText} patterns. Supportive periods call for seizing windows and converting output into credibility. Challenging periods require reduced risk, careful review, and avoiding impulsiveness.`,
    `The year **${sanitizeEnglishText(context.liuNianAnalysis.ganZhi)}** brings ${englishLiuNianRelationText} to your chart. When supported, concentrate resources and build trust through professional work. When challenged, reduce exposure and maintain careful oversight.`,
    `LiuNian **${sanitizeEnglishText(context.liuNianAnalysis.ganZhi)}** forms ${englishLiuNianRelationText} interactions. Supportive energy means expanding proven channels. Challenging energy means reducing leverage, slowing decisions, and using structured approaches.`
  ];
  
  return variations[idx];
}

export function getPart5VariationsEn(context, userInfo) {
  const seed = generateSeedFromBirthInfo(userInfo, context);
  const idx = (seed + 11) % 12;
  
  const variations = [
    `The key this year is not "good or bad luck" in the abstract, but whether your Day Master can carry the pressure placed on it by the Month Command, DaYun, and LiuNian at the same time.`,
    `What matters most this year is not some vague idea of "luck," but how your foundation set by the Month Command gets shaped, expanded, challenged, or worn down by DaYun and LiuNian together.`,
    `You're not dealing with abstract "fortune." You're dealing with what your Month Command established as your base, and how DaYun and LiuNian will act on that base—whether to amplify it, test it, or wear it out.`,
    `The real question isn't whether you'll have "good luck." It's about understanding what your Month Command established as your core, and how DaYun and LiuNian will work with that core—whether to expand it, challenge it, or consume it.`,
    `The essence of this year is not "luck" but understanding: what foundation did the Month Command give you, and how will DaYun and LiuNian shape that foundation—amplifying, testing, or transforming it.`,
    `What matters is not abstract fortune, but concrete dynamics: your Month Command set your foundation, and now DaYun and LiuNian will interact with that foundation—supporting, challenging, or reshaping it.`,
    `The core question is not "lucky or unlucky" but this: your Month Command defined your base, and DaYun and LiuNian will determine how that base evolves—whether strengthened, tested, or transformed.`,
    `Destiny is not about "good or bad luck." It's about the foundation your Month Command created, and how DaYun and LiuNian will work with that foundation—amplifying, challenging, or evolving it.`,
    `The key insight is not fortune-telling but foundation-understanding: what the Month Command established, and how DaYun and LiuNian will shape it—expanding, testing, or transforming your core.`,
    `What truly matters is not luck but leverage: your Month Command gave you a foundation, and DaYun and LiuNian will determine how that foundation is used—strengthened, challenged, or evolved.`,
    `The real question is not "what's my luck" but "what's my foundation": the Month Command set your base, and DaYun and LiuNian will show you how to work with it—expand, adapt, or strengthen.`,
    `Destiny's question is not "am I lucky" but "what is my foundation": the Month Command established your core, and DaYun and LiuNian reveal how to engage with it—amplify, adapt, or deepen.`
  ];
  
  return variations[idx];
}
