from subprocess import run, PIPE

folder = './html/'

output = (run(['ls', folder], stdout=PIPE).stdout).decode('utf-8')

files = output.split('\n')

with open(folder + 'header.html', 'r') as header_file:
    header = header_file.read()

# Add header
for fn in files:
    if fn == 'header.html' or fn == '':
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
