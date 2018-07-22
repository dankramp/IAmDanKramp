from subprocess import run, PIPE
import re

to_folder = './pages/'
from_folder = './pre/'

output = (run(['ls', from_folder], stdout=PIPE).stdout).decode('utf-8')
files = output.split('\n')

with open('base.html', 'r') as base_file:
    base = base_file.read()

fn_to_display_name = {
    'index.html': 'Home',
    'about.html': 'About Me',
    'resume.html': 'Resume',
    'younglife.html': 'Young Life',
    '404.html': '404',
}

# Add header to all pages
for fn in files:
    if fn == '':
        continue
    with open(from_folder + fn, 'r') as f:
        print('Formatting ' + fn + '...', end='')
        contents = f.read()
    # Add header and footer
    new_contents = base.replace('!CONTENT!', contents)
    # Customize title
    new_contents = new_contents.replace('!PAGENAME!', fn_to_display_name[fn])
    # Set active
    new_contents = new_contents.replace('!' + fn + '!', 'active')
    new_contents = re.sub(r'!\w+.html!', '', new_contents)
    # Localize paths and write
    if fn == 'index.html' or fn == '404.html':
        new_contents = new_contents.replace('!TOP!', './').replace('!NEST!', to_folder)
        new_contents = '---\npermalink: /' + fn + '\n---\n' + new_contents
        with open(fn, 'w') as f:
            f.write(new_contents)
    else:
        new_contents = new_contents.replace('!TOP!', '../').replace('!NEST!', '')
        new_contents = '---\npermalink: /' + fn.replace('.html', '/') + '\n---\n' + new_contents
        with open(to_folder + fn, 'w') as f:
            f.write(new_contents)
            
    print('done')
