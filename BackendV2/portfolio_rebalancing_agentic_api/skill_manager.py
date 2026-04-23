import os
import json
from typing import Optional, Dict

class SkillManager:
    def __init__(self, skills_dir: str = "skills"):
        self.skills_dir = skills_dir
        self.skills: Dict[str, dict] = {}
        self.trigger_map: Dict[str, str] = {} # maps trigger word to command
        self.load_skills()

    def load_skills(self):
        """Loads all .json files from the skills directory."""
        if not os.path.exists(self.skills_dir):
            print(f"Skills directory '{self.skills_dir}' not found, skipping skill load.")
            return

        for filename in os.listdir(self.skills_dir):
            if filename.endswith(".json"):
                path = os.path.join(self.skills_dir, filename)
                try:
                    with open(path, "r", encoding="utf-8") as f:
                        skill_data = json.load(f)
                        cmd = skill_data.get("command")
                        if cmd:
                            cmd_lower = cmd.lower()
                            self.skills[cmd_lower] = skill_data
                            
                            # Add the command itself (without slash) as a trigger
                            base_cmd = cmd_lower.lstrip("/")
                            self.trigger_map[base_cmd] = cmd_lower
                            
                            # Add explicit triggers if defined
                            triggers = skill_data.get("triggers", [])
                            for t in triggers:
                                self.trigger_map[t.lower()] = cmd_lower
                                
                except Exception as e:
                    print(f"Failed to load skill {filename}: {e}")

    def get_skill_for_message(self, message: str) -> Optional[dict]:
        """
        Matches a message to a skill based on slash commands or keywords.
        """
        clean_msg = message.strip().lower()
        if not clean_msg:
            return None
            
        parts = clean_msg.split(maxsplit=1)
        first_word = parts[0]
        
        # 1. Exact command match (including slash)
        if first_word in self.skills:
            return self.skills[first_word]
            
        # 2. Trigger/Keyword match (including command without slash)
        base_word = first_word.lstrip("/")
        if base_word in self.trigger_map:
            cmd = self.trigger_map[base_word]
            return self.skills[cmd]
            
        # 3. Fallback: Search for keywords anywhere in the message if no direct match?
        # (Keeping it focused on the first word for now to prevent accidental triggers)
        
        return None

# Singleton instance
skill_manager = SkillManager()
