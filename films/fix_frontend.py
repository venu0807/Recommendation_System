import os, glob

# This script replaces the API_BASE_URL in config.js for deployment.
# For production, set REACT_APP_API_URL in your hosting environment instead.

PRODUCTION_URL = 'https://movies-backend-ophs.onrender.com'

config_path = 'films/src/config.js'
if os.path.exists(config_path):
    with open(config_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace the default API URL with the production URL
    content = content.replace("'http://127.0.0.1:8000'", f"'{PRODUCTION_URL}'")
    
    # Remove dummy movies fallback in Context.js
    for filepath in glob.glob('films/src/**/*.js', recursive=True):
        with open(filepath, 'r', encoding='utf-8') as f:
            js_content = f.read()
        
        original = js_content
        js_content = js_content.replace('setMovies(staticMovies)', 'setMovies([])')
        js_content = js_content.replace('setUpcomingMovies(staticMovies)', 'setUpcomingMovies([])')
        js_content = js_content.replace('setNowplayingMovies(staticMovies)', 'setNowplayingMovies([])')
        js_content = js_content.replace('setTrendingMovies(staticMovies)', 'setTrendingMovies([])')
        js_content = js_content.replace('setTopratedMovies(staticMovies)', 'setTopratedMovies([])')
        
        if js_content != original:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(js_content)
            print(f'Fixed {filepath}')
    
    with open(config_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'Updated {config_path} to use {PRODUCTION_URL}')
else:
    print(f'Warning: {config_path} not found')

print('Done!')
