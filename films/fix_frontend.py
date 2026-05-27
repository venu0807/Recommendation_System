import os, glob

API_FALLBACK = "(process.env.REACT_APP_API_URL || 'https://movies-backend-ophs.onrender.com')"

for filepath in glob.glob('films/src/**/*.js', recursive=True):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    # Fix localhosts
    content = content.replace('http://127.0.0.1:8000', 'https://movies-backend-ophs.onrender.com')
    
    # Fix undefined process.env by adding fallback
    content = content.replace('process.env.REACT_APP_API_URL', API_FALLBACK)
    # Fix double replacements
    content = content.replace('(' + API_FALLBACK + " || 'https://movies-backend-ophs.onrender.com')", API_FALLBACK)
    
    # Remove dummy movies fallback
    content = content.replace('setMovies(staticMovies)', 'setMovies([])')
    content = content.replace('setUpcomingMovies(staticMovies)', 'setUpcomingMovies([])')
    content = content.replace('setNowplayingMovies(staticMovies)', 'setNowplayingMovies([])')
    content = content.replace('setTrendingMovies(staticMovies)', 'setTrendingMovies([])')
    content = content.replace('setTopratedMovies(staticMovies)', 'setTopratedMovies([])')

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Fixed {filepath}')
print('Done!')
