import os
import glob
import re

for filepath in glob.glob('films/src/**/*.js', recursive=True):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace specific quotes
    content = content.replace('"http://localhost:8000/', '`${process.env.REACT_APP_API_URL}/')
    content = content.replace("'http://localhost:8000/", '`${process.env.REACT_APP_API_URL}/')
    
    # Replace backtick interpolations and plain URLs
    content = content.replace('http://localhost:8000/', '${process.env.REACT_APP_API_URL}/')
    
    # Fix instances where the replacement resulted in double backticks: ``${...}/...`` -> `${...}/...`
    content = content.replace('``${process.env.REACT_APP_API_URL}', '`${process.env.REACT_APP_API_URL}')
    
    # Fix cases where a plain URL was at the end of a string but we replaced the start with a backtick,
    # leaving the trailing quote unmatched. e.g. "http://..." -> `${...}/..."
    # Actually, if we replaced "http://... with `${...}/, we need to replace the trailing quote with a backtick.
    content = re.sub(r'`\$\{process\.env\.REACT_APP_API_URL\}([^"\']*?)["\']', r'`${process.env.REACT_APP_API_URL}\1`', content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
print("Done fixing URLs!")
