"""
AI 服务 - 元景大模型 API 调用 (OPENAI 兼容模式)
"""
import json
import time
from typing import Optional, Dict, List, Any
from openai import OpenAI
from ..config import settings
from .. import prompts


class AIService:
    """元景大模型 AI 服务类 (使用 OPENAI 兼容模式)"""

    @classmethod
    def _describe_tension_level(cls, value: Any) -> str:
        """将数值张力映射为更可读的策展语义。"""
        try:
            numeric_value = float(value)
        except (TypeError, ValueError):
            return "张力未知"

        if numeric_value >= 75:
            return "高张力"
        if numeric_value >= 55:
            return "偏高张力"
        if numeric_value >= 35:
            return "中段张力"
        return "低张力"

    @classmethod
    def _build_rhythm_instruction(
        cls,
        narrative_rhythm: Optional[Dict[str, Any]],
        section_type: str = "general"
    ) -> str:
        """将前端节奏配置转换为可读、可执行的提示词片段。"""
        if not narrative_rhythm:
            return ""
        if narrative_rhythm.get("enabled") is False:
            return ""

        points = narrative_rhythm.get("points") or []
        stages = narrative_rhythm.get("stages") or []
        summary = narrative_rhythm.get("summary") or ""

        if not points:
            return ""

        paired_points = []
        for index, value in enumerate(points):
            stage = stages[index] if index < len(stages) else f"阶段{index + 1}"
            paired_points.append(f"{stage}:{value}（{cls._describe_tension_level(value)}）")

        points_text = "，".join(paired_points)
        summary_text = f"\n- 节奏解读：{summary}" if summary else ""
        peak_value = max(points)
        valley_value = min(points)
        peak_stage = stages[points.index(peak_value)] if points.index(peak_value) < len(stages) else "高潮阶段"
        valley_stage = stages[points.index(valley_value)] if points.index(valley_value) < len(stages) else "低谷阶段"
        start_value = points[0]
        end_value = points[-1]

        if end_value > start_value + 12:
            trend_text = "整体走势为逐步抬升，后段应更有推进感与情绪聚焦。"
        elif end_value < start_value - 12:
            trend_text = "整体走势为由强转缓，后段应更注重沉淀、回看与收束。"
        else:
            trend_text = "整体走势较为均衡，应突出节奏层次而非单向拔高。"

        section_requirements = {
            "preface": (
                "- 这是展览序言，要重点承接前半段节奏：先建立背景与观看入口，再为后续高潮蓄势，避免一开篇就把情绪推满。\n"
                "- 序言结尾要形成明确的入场过渡，让观众自然进入第一单元。"
            ),
            "text_section": (
                "- 这是主体单元文案，要把节奏曲线落实到段落结构中：导言负责定位本单元在整条叙事线中的位置，重点展品解读负责推进、转折或聚焦，小结负责阶段性收束。\n"
                "- 当曲线进入高张力阶段时，语言更凝练、更具推进感；当曲线回落时，语言更沉着，更强调解释、回看与余味。"
            ),
            "epilogue": (
                "- 这是展览尾声，要承接高潮后的回响与收束，先提炼整场展览的精神重心，再将情绪缓缓落下，留下余韵而非再次另起高潮。\n"
                "- 尾声要与前文保持同一条节奏线，体现回望、升华和邀请再思考的结束感。"
            ),
            "general": (
                "- 请让文本结构与节奏阶段同步推进，不能只引用曲线而不落实到内容组织中。\n"
                "- 请让文风随张力变化：低张力阶段更舒展、说明性更强；高张力阶段更集中、句式更有推动力；转折处强化对比与视角切换。"
            ),
        }
        section_text = section_requirements.get(section_type, section_requirements["general"])

        return (
            "\n【叙事节奏要求】\n"
            "- 请参考用户在前端拖拽得到的节奏曲线来组织叙事推进。\n"
            f"- 各阶段张力值：{points_text}{summary_text}\n"
            f"- 节奏峰值出现在「{peak_stage}」，低谷出现在「{valley_stage}」。\n"
            f"- {trend_text}\n"
            "- 请同时控制“结构”和“文风”：段落安排、信息密度、句式长短、语气强弱都要服从这条曲线。\n"
            f"{section_text}\n"
            "- 生成内容时，不要机械复述这些规则，而要把它们内化为自然、连贯的策展表达。"
        )
    
    @classmethod
    def _get_client(cls) -> OpenAI:
        """获取 OpenAI 客户端"""
        return OpenAI(
            api_key=settings.yuanjing_api_key,
            base_url=settings.yuanjing_base_url,
        )
    
    @classmethod
    def chat_completion(
        cls,
        messages: List[Dict[str, str]],
        model: str = "sea-llm-235b",
        temperature: float = 0.7,
        max_tokens: int = 2000,
        **kwargs
    ) -> Dict[str, Any]:
        """
        调用元景大模型进行对话补全
        
        Args:
            messages: 消息列表，格式为 [{"role": "user/assistant/system", "content": "..."}]
            model: 模型名称 (默认 sea-llm-235b)
            temperature: 温度参数
            max_tokens: 最大 token 数
            **kwargs: 其他参数
        
        Returns:
            包含回复内容的字典
        """
        client = cls._get_client()
        
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            **kwargs
        )
        
        return {
            "content": response.choices[0].message.content,
            "model": response.model,
            "usage": {
                "prompt_tokens": response.usage.prompt_tokens,
                "completion_tokens": response.usage.completion_tokens,
                "total_tokens": response.usage.total_tokens,
            }
        }
    
    @classmethod
    def generate_narrative_options(
        cls,
        theme: str,
        exhibit_count: int,
        exhibit_info: str,
        additional_intent: str = None,
        narrative_rhythm: Dict[str, Any] = None,
        unit_count: int = 3,
        temperature: float = 0.7
    ) -> List[Dict[str, str]]:
        """
        生成叙事方向方案
        
        Args:
            theme: 展览主题
            exhibit_count: 展品数量
            exhibit_info: 展品信息
            additional_intent: 补充策展意图
            unit_count: 单元数量
            temperature: AI温度参数
        
        Returns:
            叙事方案列表
        """
        random_suffix = str(int(time.time() * 1000))[-6:]
        
        additional_info = f"\n补充策展意图：{additional_intent}" if additional_intent else ""
        rhythm_instruction = cls._build_rhythm_instruction(narrative_rhythm)
        system_prompt = prompts.NARRATIVE_SYSTEM + f"\n这是第{random_suffix}次请求，请给出独特的方案。建议设计{unit_count}个单元。"
        user_prompt = prompts.NARRATIVE_USER.format(
            theme=theme,
            exhibit_count=exhibit_count,
            exhibit_info=exhibit_info,
            additional_intent=additional_info,
            rhythm_instruction=rhythm_instruction
        )
        
        result = cls.chat_completion(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=temperature
        )
        
        try:
            content = result["content"]
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            elif "```" in content:
                content = content.split("```")[1].split("```")[0]
            
            options = json.loads(content.strip())
            normalized_options = []
            for option in options[:3]:
                normalized_options.append({
                    "title": theme,
                    "desc": option.get("desc", "") if isinstance(option, dict) else ""
                })
            return normalized_options
        except Exception as e:
            return [
                {"title": theme, "desc": "以文明交流为切入点，组织展品之间的互动关系。"},
                {"title": theme, "desc": "以技术传播与工艺演进为主线，突出材料与制作方法的流动。"},
                {"title": theme, "desc": "以艺术风格与审美共鸣为重点，强调不同地域之间的视觉呼应。"}
            ]
    
    @classmethod
    def generate_units(
        cls,
        narrative: Dict,
        exhibit_count: int,
        unit_count: int = 3,
        exhibit_list: List[Dict] = None,
        narrative_rhythm: Dict[str, Any] = None
    ) -> List[Dict[str, Any]]:
        """
        生成展览单元结构
        
        Args:
            narrative: 选择的叙事方案
            exhibit_count: 展品数量
            unit_count: 单元数量
            exhibit_list: 展品列表
        
        Returns:
            单元列表
        """
        exhibit_list = exhibit_list or []
        exhibit_summary = "\n".join([
            f"- {ex.get('name', '未知展品')}: {ex.get('era', '')} {ex.get('material', '')}"
            for ex in exhibit_list[:20]
        ])
        rhythm_instruction = cls._build_rhythm_instruction(narrative_rhythm)
        
        system_prompt = prompts.UNITS_SYSTEM
        user_prompt = prompts.UNITS_USER.format(
            narrative_title=narrative.get('title', ''),
            narrative_desc=narrative.get('desc', ''),
            narrative_logic=narrative.get('logic', ''),
            rhythm_instruction=rhythm_instruction,
            exhibit_count=exhibit_count,
            exhibit_list=exhibit_summary,
            unit_count=unit_count
        )
        
        result = cls.chat_completion(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.7
        )
        
        try:
            content = result["content"]
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            elif "```" in content:
                content = content.split("```")[1].split("```")[0]
            
            units = json.loads(content.strip())
            return units
        except Exception as e:
            return [
                {"tag": "第一单元", "title": "开篇", "description": "展览引言", "theme": "引言"},
                {"tag": "第二单元", "title": "核心展示", "description": "主要展品", "theme": "展示"},
                {"tag": "第三单元", "title": "文化解读", "description": "文化内涵", "theme": "文化"},
                {"tag": "第四单元", "title": "总结", "description": "展览结语", "theme": "结语"}
            ]
    
    @classmethod
    def recommend_exhibits(
        cls,
        exhibit_pool: List[Dict],
        unit_theme: str,
        unit_description: str,
        narrative: Dict = None,
        max_count: int = 10
    ) -> List[Dict[str, Any]]:
        """
        为单元推荐展品
        
        Args:
            exhibit_pool: 展品池
            unit_theme: 单元主题
            unit_description: 单元描述
            narrative: 叙事方案
            max_count: 最大推荐数量
        
        Returns:
            推荐展品列表（带置信度）
        """
        exhibit_info = "\n".join([
            f"{i+1}. {ex.get('name', '未知')} ({ex.get('era', '')}, {ex.get('material', '')})"
            for i, ex in enumerate(exhibit_pool)
        ])
        
        if narrative is None:
            narrative = {}
        
        system_prompt = prompts.RECOMMEND_SYSTEM
        user_prompt = prompts.RECOMMEND_USER.format(
            unit_title=unit_theme,
            unit_desc=unit_description,
            narrative_title=narrative.get('title', ''),
            exhibit_pool=exhibit_info,
            total_exhibits=len(exhibit_pool),
            items_count=max_count
        )
        
        print(f"[AI Service] ====== SENDING TO AI ======")
        print(f"System: {system_prompt}")
        print(f"User: {user_prompt}")
        print(f"======================================")
        
        result = cls.chat_completion(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.5,
            max_tokens=1000
        )
        
        try:
            content = result["content"]
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            elif "```" in content:
                content = content.split("```")[1].split("```")[0]
            
            recommendations = json.loads(content.strip())
            
            print(f"[AI Service] Raw recommendations from AI: {recommendations}")
            print(f"[AI Service] max_count: {max_count}")
            
            recommended = []
            for rec in recommendations[:max_count]:
                idx = rec.get("exhibit_index", 0)
                pool_index = None
                original_index = None

                # 优先按提示词约定兼容 1-based 索引，同时兼容模型偶发返回 0-based 的情况
                if isinstance(idx, int) and 1 <= idx <= len(exhibit_pool):
                    pool_index = idx - 1
                    original_index = idx
                elif isinstance(idx, int) and 0 <= idx < len(exhibit_pool):
                    pool_index = idx
                    original_index = idx + 1

                if pool_index is not None:
                    exhibit = exhibit_pool[pool_index].copy()
                    exhibit["original_index"] = original_index
                    exhibit["confidence"] = rec.get("confidence", 3)
                    exhibit["reason"] = str(rec.get("reason", "") or "").strip()
                    recommended.append(exhibit)
            
            return recommended
        except Exception as e:
            return [
                {
                    **ex,
                    "original_index": i + 1,
                    "confidence": 3,
                    "reason": ""
                }
                for i, ex in enumerate(exhibit_pool[:max_count])
            ]
    
    @classmethod
    def recommend_exhibits_batch(
        cls,
        units: List[Dict],
        exhibit_pool: List[Dict],
        narrative: Dict
    ) -> Dict[str, Any]:
        """
        批量为所有单元推荐展品
        
        Args:
            units: 单元列表（每个单元包含items字段指定展品数量）
            exhibit_pool: 展品池
            narrative: 叙事方案
        
        Returns:
            包含recommendations和leftovers的字典
        """
        recommendations = {}
        used_indices = set()
        
        for idx, unit in enumerate(units):
            unit_theme = unit.get('title', '')
            unit_desc = unit.get('description', '')
            unit_items = unit.get('items', 5)
            
            print(f"[AI Service] Unit {idx}: {unit_theme}, items: {unit_items}")
            
            unit_key = str(unit.get('id', idx))
            
            remaining_pool = [ex for i, ex in enumerate(exhibit_pool) if i not in used_indices]
            
            if len(remaining_pool) == 0:
                recommendations[unit_key] = []
                continue
            
            unit_recommendations = cls.recommend_exhibits(
                exhibit_pool=remaining_pool,
                unit_theme=unit_theme,
                unit_description=unit_desc,
                narrative=narrative,
                max_count=unit_items
            )
            
            print(f"[AI Service] Unit {idx}: got {len(unit_recommendations)} recommendations")
            
            unit_exhibits = []
            used_names = set()
            for rec in unit_recommendations:
                # 使用 original_index 如果存在，否则使用 exhibit_index
                exhibit_idx = rec.get('original_index', rec.get('exhibit_index', 0))
                print(f"[AI Service] Processing rec: {rec}, exhibit_idx={exhibit_idx}, remaining_pool len={len(remaining_pool)}")
                # 直接从 remaining_pool 获取展品
                if 0 < exhibit_idx <= len(remaining_pool):
                    ex = remaining_pool[exhibit_idx - 1]
                    print(f"[AI Service] Got exhibit: {ex.get('name')}")
                    # 避免重复添加同名展品
                    if ex.get('name') not in used_names:
                        used_names.add(ex.get('name'))
                        # 追踪原始池中的索引
                        for orig_idx, orig_ex in enumerate(exhibit_pool):
                            if orig_ex.get('name') == ex.get('name') and orig_idx not in used_indices:
                                used_indices.add(orig_idx)
                                break
                        unit_exhibits.append({
                            **ex,
                            "kept": True,
                            "ctx": "AI推荐",
                            "src": "AI推荐",
                            "stars": rec.get("confidence", 5),
                            "reason": rec.get("reason", "")
                        })
                else:
                    print(f"[AI Service] Index out of range! exhibit_idx={exhibit_idx}, remaining_pool len={len(remaining_pool)}")
            
            recommendations[unit_key] = unit_exhibits
            print(f"[AI Service] Unit {idx}: final unit_exhibits count = {len(unit_exhibits)}, used_names count = {len(used_names)}")
        
        leftovers = [ex for i, ex in enumerate(exhibit_pool) if i not in used_indices]
        
        print(f"[AI Service] Final recommendations: {recommendations}")
        print(f"[AI Service] used_indices count: {len(used_indices)}, total exhibits: {len(exhibit_pool)}, leftovers count: {len(leftovers)}")
        
        return {
            "recommendations": recommendations,
            "leftovers": leftovers
        }
    
    @classmethod
    def generate_text_section(
        cls,
        unit: Dict,
        exhibits: List[Dict],
        narrative: Dict,
        narrative_rhythm: Dict[str, Any] = None
    ) -> str:
        """
        生成单元文本内容
        
        Args:
            unit: 单元信息
            exhibits: 单元展品列表
            narrative: 叙事方案
        
        Returns:
            HTML格式的文本内容
        """
        exhibit_info = "\n".join([
            f"- {ex.get('name', '未知')}: {ex.get('era', '')} {ex.get('material', '')} {ex.get('size', '')}"
            for ex in exhibits
        ])
        rhythm_instruction = cls._build_rhythm_instruction(narrative_rhythm, section_type="text_section")
        
        system_prompt = prompts.TEXT_SYSTEM
        user_prompt = prompts.TEXT_USER.format(
            unit_title=unit.get('title', ''),
            unit_desc=unit.get('description', ''),
            exhibit_names=exhibit_info,
            narrative_title=narrative.get('title', ''),
            rhythm_instruction=rhythm_instruction
        )
        
        result = cls.chat_completion(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.7,
            max_tokens=4000
        )
        
        return result["content"]
    
    @classmethod
    def generate_preface(
        cls,
        exhibition_title: str,
        narrative: Dict,
        unit_count: int,
        narrative_rhythm: Dict[str, Any] = None
    ) -> str:
        """
        生成展览序言
        
        Args:
            exhibition_title: 展览标题
            narrative: 叙事方案
            unit_count: 单元数量
        
        Returns:
            HTML格式的序言内容
        """
        rhythm_instruction = cls._build_rhythm_instruction(narrative_rhythm, section_type="preface")
        system_prompt = prompts.PREFACE_SYSTEM
        user_prompt = prompts.PREFACE_USER.format(
            exhibition_title=exhibition_title,
            narrative_title=narrative.get('title', ''),
            narrative_desc=narrative.get('desc', ''),
            unit_count=unit_count,
            rhythm_instruction=rhythm_instruction
        )
        
        result = cls.chat_completion(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.7,
            max_tokens=2000
        )
        
        content = result["content"]
        try:
            json_match = content.strip()
            if json_match.startswith("```json"):
                json_match = json_match[7:]
            if json_match.startswith("```"):
                json_match = json_match[3:]
            if json_match.endswith("```"):
                json_match = json_match[:-3]
            json_match = json_match.strip()
            data = json.loads(json_match)
            return f"<p>{data.get('content', '')}</p>"
        except Exception:
            return f"<p>{content}</p>"
    
    @classmethod
    def generate_epilogue(
        cls,
        exhibition_title: str,
        narrative: Dict,
        unit_count: int,
        narrative_rhythm: Dict[str, Any] = None
    ) -> str:
        """
        生成展览尾声
        
        Args:
            exhibition_title: 展览标题
            narrative: 叙事方案
            unit_count: 单元数量
        
        Returns:
            HTML格式的尾声内容
        """
        rhythm_instruction = cls._build_rhythm_instruction(narrative_rhythm, section_type="epilogue")
        system_prompt = prompts.EPILOGUE_SYSTEM
        user_prompt = prompts.EPILOGUE_USER.format(
            exhibition_title=exhibition_title,
            narrative_title=narrative.get('title', ''),
            narrative_desc=narrative.get('desc', ''),
            unit_count=unit_count,
            rhythm_instruction=rhythm_instruction
        )
        
        result = cls.chat_completion(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.7,
            max_tokens=2000
        )
        
        content = result["content"]
        try:
            json_match = content.strip()
            if json_match.startswith("```json"):
                json_match = json_match[7:]
            if json_match.startswith("```"):
                json_match = json_match[3:]
            if json_match.endswith("```"):
                json_match = json_match[:-3]
            json_match = json_match.strip()
            data = json.loads(json_match)
            return f"<p>{data.get('content', '')}</p>"
        except Exception:
            return f"<p>{content}</p>"
    
    @classmethod
    def generate_outline(
        cls,
        units: List[Dict],
        text_sections: List[Dict],
        narrative: Dict
    ) -> Dict[str, Any]:
        """
        生成展览大纲
        
        Args:
            units: 单元列表
            text_sections: 文本段落列表
            narrative: 叙事方案
        
        Returns:
            大纲结构
        """
        units_info = "\n".join([
            f"- {u.get('tag', '')}: {u.get('title', '')}"
            for u in units
        ])
        
        sections_info = "\n".join([
            f"- {s.get('title', '')}"
            for s in text_sections
        ])
        
        system_prompt = prompts.OUTLINE_SYSTEM
        user_prompt = prompts.OUTLINE_USER.format(
            theme=theme,
            narrative_title=narrative.get('title', ''),
            narrative_desc=narrative.get('desc', ''),
            units_summary=units_info
        )
        
        result = cls.chat_completion(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.6,
            max_tokens=2000
        )
        
        try:
            content = result["content"]
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            elif "```" in content:
                content = content.split("```")[1].split("```")[0]
            
            return json.loads(content.strip())
        except Exception as e:
            return {
                "title": f"展览：{narrative.get('title', '展览')}",
                "toc": [{"id": f"unit{i+1}", "title": u.get("title", ""), "page": i+1} for i, u in enumerate(units)],
                "sections": {}
            }


ai_service = AIService()
