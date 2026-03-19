from pathlib import Path
path = Path('apps/web/src/components/Vision360Form.jsx')
for idx, line in enumerate(path.read_text().splitlines(), 1):
    if 'SummaryValue' in line or 'renderedValue' in line:
        print(idx, line.strip())
