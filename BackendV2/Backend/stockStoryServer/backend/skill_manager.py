import os
import json
from typing import Optional, Dict

class SkillManager:
    def __init__(self, skills_dir: str = "skills"):
        self.skills_dir = skills_dir
        self.skills: Dict[str, dict] = {}
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
                            self.skills[cmd.lower()] = skill_data
                except Exception as e:
                    print(f"Failed to load skill {filename}: {e}")

    def get_skill_for_message(self, message: str) -> Optional[dict]:
        """
        Checks if the message starts with a known skill command.
        Example: '/mock_financial AAPL' -> matches '/mock_financial'
        """
        if not message.startswith("/"):
            return None
        
        parts = message.split(maxsplit=1)
        command = parts[0].lower()
        return self.skills.get(command)

# Singleton instance
skill_manager = SkillManager()
