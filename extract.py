import re
from bs4 import BeautifulSoup

def extract_endpoints(filename):
    with open(filename, 'r') as f:
        html = f.read()
    
    soup = BeautifulSoup(html, 'html.parser')
    endpoints = []
    
    # In Tesla's docs, endpoints are in sections.
    # Let's look for all h3 tags
    for h3 in soup.find_all('h3'):
        name = h3.get_text(strip=True)
        if name in ["Endpoints", "Parameters", "Response"]: continue
        
        ep = {'name': name}
        
        # Look for method and path in the next code block
        code_tag = h3.find_next('code')
        if code_tag:
            code_text = code_tag.get_text(strip=True)
            match = re.search(r'(GET|POST|DELETE|PUT)\s+([^\s]+)', code_text)
            if match:
                ep['method'] = match.group(1)
                ep['path'] = match.group(2)
        
        # Look for description
        p_tag = h3.find_next('p')
        if p_tag:
            ep['summary'] = p_tag.get_text(strip=True)
            
        # Search for scopes and pricing categories in the next few elements
        # Tesla docs often have these in a div after the h3
        parent = h3.parent
        if parent:
            text = parent.get_text()
            scope_match = re.search(r'Scope:\s*([a-z_:]+)', text, re.I)
            if scope_match: ep['scope'] = scope_match.group(1)
            
            pricing_match = re.search(r'Pricing Category:\s*([A-Za-z ]+)', text, re.I)
            if pricing_match: ep['pricing'] = pricing_match.group(1)

        endpoints.append(ep)
    
    return endpoints

files = ['energy.html', 'vehicle.html', 'charging.html']
for f in files:
    print(f"--- {f} ---")
    for ep in extract_endpoints(f):
        print(ep)
