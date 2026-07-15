with open('src/app/components/subscription/RescheduleTab.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

idx = c.find('setOtpErr')
print('CONTEXT:', repr(c[idx-20:idx+300]))
