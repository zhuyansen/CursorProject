/**
 * BibiGPT API 配置文件
 * 用于视频分析和食谱提取
 */

// API端点
export const BIBIGPT_API_ENDPOINT = 'https://api.bibigpt.co/api/open/qQYDOv6u47KR';

// 最大处理时间（秒）
export const MAX_DURATION = 3600;

// 提示词配置
export const RECIPE_EXTRACTION_PROMPT = "{\"role\": \"您是一位专业的食谱解析AI助手，擅长从烹饪视频中提取结构化信息\", \"skills\": {\"video_analysis\": {\"description\": \"解析YouTube/Bilibili烹饪视频内容\", \"steps\": [\"识别视频中的关键时间节点和操作阶段\", \"分析解说词和视觉信息中的食材用量\", \"计算各步骤的实际操作耗时\"]}, \"data_extraction\": {\"description\": \"精准提取烹饪步骤要素\", \"elements\": [\"步骤标题（动词开头的祈使句）\", \"使用食材（包含精确计量单位）\", \"时间消耗（分钟/秒为单位）\", \"核心操作要点（3-5个短句）\"]}, \"formatting\": {\"description\": \"生成标准化数据结构\", \"requirements\": [\"使用UTF-8编码的JSON格式\", \"包含metadata字段记录视频源信息\", \"steps数组按时间顺序排列\", \"每个步骤包含title/ingredients/time/instructions字段\"]}}, \"constraints\": [\"仅处理烹饪教学类视频内容\", \"食材名称使用英文，比如Potato, Carrot, Onion, Tomato, Celery, Cabbage, Cucumber, Spinach, Lettuce, White Radish, Broccoli, Mushroom, Eggplant, Tofu, Beef, Bacon, Chicken, Pork, Prawns, Sausage, Salmon, Lamb, Ham, Egg, Fish\", \"时间单位统一转换为分钟（精确到0.5分钟）\", \"all_time是每个步骤的time总和，单位为min，形式如：5 min\", \"all_time总时间消耗少的尽量三个step，中等的五个step，长的七个step\", \"quantity中文适量需要转换为as_needed, 少许和少量需要转换为little, 其他使用重量单位、体积单位和其他常见计量单位的英文\"], \"output_example\": {\"metadata\": {\"strMeal\": \"食谱名称英文表示，比如Garides Saganaki\", \"strArea\": \"返回国家的英文名比如Greek\", \"strTags\": \"只在Breakfast, Lunch, Dinner, Desserts, Snacks, Drinks, Vegetarian, Seafood, Soup中选择\", \"cookingMethods\": \"只在Bake, Pan Fry, Deep Fry, Stir Fry, Stew, Boil, Steam中选择\", \"mealStyle\": \"只在Western、Eastern中选择\", \"difficulty\": \"只在Easy、Medium、Hard中选择\", \"all_time\": \"各个步骤的总时长，xx min\", \"videoSummary\": \"总结视频内容，简单易懂，这是一个食谱网站，需要更吸引观众，用英文表示\";  \"steps的步骤最少2个, 至多8个,需要根据视频时长和步骤来输出,ingredients最好都识别出来\"}, \"steps\": [{\"step_number\": 1, \"title\": \"英文内容返回，比如食材预处理\", \"ingredients\": [{\"name\": \"英文食材名称返回，比如\"beef\",必须是食材； \"quantity\": \"500 g\"，是类似的计量单位，甚至比如\"little\",\"as_needed\"}, {\"name\": \"英文名称返回，比如dark soy sauce\", \"quantity\": \"1 spoon\"}], \"time\": 15.5, \"instructions\": [\"将牛腩切3cm见方块\", \"冷水浸泡出血水\", \"沥干备用\"]}]}}";

// 默认配置
export const DEFAULT_PROMPT_CONFIG = {
  outputLanguage: "en-US",
  detailLevel: 3,
  isRefresh: false,
  showEmoji: true
};

/**
 * 构建BibiGPT API请求选项
 * @param videoUrl 视频URL
 * @returns 请求选项
 */
export function buildBibiGPTRequestOptions(videoUrl: string) {
  return {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      promptConfig: DEFAULT_PROMPT_CONFIG,
      includeDetail: true,
      prompt: RECIPE_EXTRACTION_PROMPT,
      limitation: {
        maxDuration: MAX_DURATION
      },
      url: videoUrl
    })
  };
}

/**
 * 处理BibiGPT API返回的数据
 * @param data API返回的原始数据
 * @returns 处理后的数据
 */
export function processBibiGPTResponse(data: any) {
  // 处理summary字段，将其从JSON字符串转换为对象
  if (data && data.summary && typeof data.summary === 'string') {
    try {
      // 提取JSON字符串部分
      const jsonMatch = data.summary.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch && jsonMatch[1]) {
        // 解析JSON字符串为对象
        const parsedSummary = JSON.parse(jsonMatch[1]);
        // 替换原始summary字段
        data.summary = parsedSummary;
        console.log('[BibiGPT] 成功解析summary字段为JSON对象');
      } else {
        console.warn('[BibiGPT] 无法从summary中提取JSON字符串');
      }
    } catch (error) {
      console.error('[BibiGPT] 解析summary JSON时出错:', error);
    }
  }
  
  return data;
}
