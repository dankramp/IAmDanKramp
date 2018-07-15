from subprocess import run, PIPE

folder = './pages/'

output = (run(['ls', folder], stdout=PIPE).stdout).decode('utf-8')
files = output.split('\n')

with open('header.html', 'r') as header_file:
    header = header_file.read()

# Home page
with open('index.html', 'r') as f:
    print('Adding header to index.html...', end='')
    contents = f.read()
    nav_index = contents.find('<nav')
    if nav_index == -1:
        print('could not insert header')
    first = contents[:nav_index]
    second = contents[contents.find('</nav>') + 6:]
with open('index.html', 'w') as f:
    f.write(first + header.replace('!TOP!', '').replace('!NEST!', folder) + second)
    print('done')

# Change header to localized paths
header = header.replace('!TOP!', '../').replace('!NEST!', '')

# Add header to all pages
for fn in files:
    if fn == '':
        continue
    with open(folder + fn, 'r') as f:
        print('Adding header to ' + fn + '...', end='')
        contents = f.read()
        nav_index = contents.find('<nav')
        if nav_index == -1:
            print('could not insert header')
            continue
        first = contents[:nav_index]
        second = contents[contents.find('</nav>') + 6:]
    with open(folder + fn, 'w') as f:
        f.write(first + header + second)
        print('done')
