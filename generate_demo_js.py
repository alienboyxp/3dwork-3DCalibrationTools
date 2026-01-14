import os
import glob

output_file = 'src/assets/demoData.js'
assets_dir = 'src/assets/'
files = {
    'klippy': 'klippy.txt',
    'moonraker': 'moonraker.txt',
    'dmesg': 'dmesg.txt',
    'debug': 'debug.txt'
}

js_content = ["window.demoLogData = {"]

for key, filename in files.items():
    filepath = os.path.join(assets_dir, filename)
    if os.path.exists(filepath):
        try:
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                # Escape backticks and backslashes for template literal safety
                # We need to escape backslashes first to avoid double escaping
                content = content.replace('\\', '\\\\')
                content = content.replace('`', '\\`')
                content = content.replace('${', '\\${')
                
                js_content.append(f'    {key}: `{content}`,\n')
        except Exception as e:
            print(f"Error reading {filename}: {e}")
            js_content.append(f'    {key}: "",\n')
    else:
        print(f"File not found: {filepath}")
        js_content.append(f'    {key}: "",\n')

js_content.append("};")

with open(output_file, 'w', encoding='utf-8') as f:
    f.write("".join(js_content))

print(f"Successfully generated {output_file}")
