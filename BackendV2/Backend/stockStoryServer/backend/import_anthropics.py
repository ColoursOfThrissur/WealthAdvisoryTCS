import os
import json
import re
import yaml

ANTHROPICS_DIR = "/Users/saran/Desktop/Stock story/financial-services-plugins"
BACKEND_DIR = "/Users/saran/Desktop/Stock story/stock_story/backend"
SKILLS_OUT_DIR = os.path.join(BACKEND_DIR, "skills")

def main():
    os.makedirs(SKILLS_OUT_DIR, exist_ok=True)
    mcp_config = {"servers": {}}
    
    # Existing mock_server
    try:
        with open(os.path.join(BACKEND_DIR, "mcp_config.json"), "r") as f:
            exist_mcp = json.load(f)
            mcp_config["servers"].update(exist_mcp.get("servers", {}))
    except:
        pass

    # Find all .mcp.json
    for root, dirs, files in os.walk(ANTHROPICS_DIR):
        if ".mcp.json" in files:
            mcp_path = os.path.join(root, ".mcp.json")
            try:
                with open(mcp_path, "r") as f:
                    data = json.load(f)
                    for srv_name, srv_info in data.get("mcpServers", {}).items():
                        # We use HTTP / SSE
                        mcp_config["servers"][srv_name] = {
                            "type": "sse",
                            "url": srv_info.get("url", "")
                        }
            except Exception as e:
                print(f"Error reading {mcp_path}: {e}")

    # Write mcp_config.json
    with open(os.path.join(BACKEND_DIR, "mcp_config.json"), "w") as f:
        json.dump(mcp_config, f, indent=4)
    print(f"✅ Generated mcp_config.json with {len(mcp_config['servers'])} servers.")

    # Find all commands and map to skills
    for root, dirs, files in os.walk(ANTHROPICS_DIR):
        if os.path.basename(root) == "commands":
            plugin_root = os.path.dirname(root)
            skills_dir = os.path.join(plugin_root, "skills")
            
            for file in files:
                if not file.endswith(".md"):
                    continue
                cmd_name = "/" + file[:-3]
                cmd_path = os.path.join(root, file)
                
                with open(cmd_path, "r", encoding="utf-8") as f:
                    content = f.read()

                # Parse Frontmatter
                header_match = re.search(r"^---\n(.*?)\n---", content, re.DOTALL)
                description = "Financial Skill"
                if header_match:
                    try:
                        frontmatter = yaml.safe_load(header_match.group(1))
                        if isinstance(frontmatter, dict):
                            description = frontmatter.get("description", description)
                    except:
                        pass
                    # Remove frontmatter from instruction text
                    instruction_text = content[header_match.end():].strip()
                else:
                    instruction_text = content.strip()

                # Find `skill: "skill-name"` references to inline
                skill_refs = re.findall(r'skill:\s*["\']?([a-zA-Z0-9_-]+)["\']?', instruction_text)
                # Support `Load the \`skill-name\` skill`
                skill_refs += re.findall(r'`([a-zA-Z0-9_-]+)`\s*skill', instruction_text)
                
                # Fallback: if there's a skill folder matching the command name exactly
                cmd_name_clean = file[:-3]
                if cmd_name_clean not in skill_refs and os.path.exists(os.path.join(skills_dir, cmd_name_clean)):
                    skill_refs.append(cmd_name_clean)
                
                skill_refs = list(set(skill_refs))
                
                inlined_skills_text = ""
                for sr in skill_refs:
                    skill_md_path = os.path.join(skills_dir, sr, "SKILL.md")
                    if os.path.exists(skill_md_path):
                        with open(skill_md_path, "r", encoding="utf-8") as sf:
                            inlined_skills_text += f"\n\n--- SKILL {sr.upper()} CONTEXT ---\n"
                            inlined_skills_text += sf.read()

                final_instructions = instruction_text + inlined_skills_text
                
                # Required servers (rough guess by searching text for mcp names)
                req_servers = []
                for srv in mcp_config["servers"]:
                    if srv.lower() in final_instructions.lower():
                        req_servers.append(srv)

                skill_obj = {
                    "command": cmd_name,
                    "description": description,
                    "required_mcp_servers": req_servers,
                    "agent_instructions": final_instructions
                }
                
                out_path = os.path.join(SKILLS_OUT_DIR, f"{file[:-3]}.json")
                with open(out_path, "w", encoding="utf-8") as outf:
                    json.dump(skill_obj, outf, indent=4)
                
                print(f"✅ Created skill: {cmd_name} -> {out_path}")

if __name__ == "__main__":
    main()
