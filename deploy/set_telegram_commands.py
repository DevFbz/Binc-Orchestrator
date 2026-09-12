import json
import os
import urllib.request

commands = [
    {"command": "status", "description": "Resumo de todos os projetos"},
    {"command": "projetos", "description": "Listar projetos e status"},
    {"command": "jobs", "description": "Ver automações e jobs"},
    {"command": "relatorio", "description": "Gerar relatório executivo"},
    {"command": "financeiro", "description": "Consultar resumo financeiro"},
    {"command": "sprint", "description": "Ver próxima sprint e pendências"},
    {"command": "instagram", "description": "Status do projeto Instagram"},
]
body = json.dumps({"commands": commands}).encode()
url = "https://api.telegram.org/bot" + os.environ["TELEGRAM_BOT_TOKEN"] + "/setMyCommands"
request = urllib.request.Request(url, data=body, method="POST", headers={"Content-Type": "application/json"})
with urllib.request.urlopen(request, timeout=20) as response:
    result = json.load(response)
print({"ok": result.get("ok"), "command_count": len(commands)})
