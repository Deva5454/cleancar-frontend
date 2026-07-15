with open('src/app/components/subscription/CustomerPlanPage.tsx', 'rb') as f:
    c = f.read()

# Replace corrupt emoji bytes with clean text
# Vehicle category icons
c = c.replace(b'icon: "\xf0\x9f\x9a\x97"', b'icon: "Hatchback"')
c = c.replace(b'icon: "\xf0\x9f\x9a\x99"', b'icon: "SUV"')
c = c.replace(b'icon: "\xf0\x9f\x8f\x8e\xef\xb8\x8f"', b'icon: "Luxury"')

# Hero badge
c = c.replace(b'"\xf0\x9f\x9a\x97 Surat\'s #1 Daily Car Wash"', b'"Surat\'s #1 Daily Car Wash"')

# Trust items
c = c.replace(b'"\xf0\x9f\x93\xb8 Before & after photos every wash"', b'"Before & after photos every wash"')
c = c.replace(b'"\xf0\x9f\x8f\xa0 We come to you"', b'"We come to you"')
c = c.replace(b'"\xf0\x9f\x93\x9e Easy cancellation process"', b'"Easy cancellation process"')
c = c.replace(b'"\xf0\x9f\x94\x92 Razorpay secured"', b'"Razorpay secured"')
c = c.replace(b'"\xf0\x9f\x93\xb8 Before & after photos"', b'"Before & after photos"')
c = c.replace(b'"\xf0\x9f\x8f\xa0 Home, office, society"', b'"Home, office, society"')

# Plan icons
c = c.replace(b'icon:"\xe2\x9a\xa1"', b'icon:"EX"')
c = c.replace(b'icon:"\xe2\x9c\xa8"', b'icon:"SM"')
c = c.replace(b'icon:"\xf0\x9f\x91\x91"', b'icon:"EL"')

# Pack icons  
c = c.replace(b'icon:"1\xef\xb8\x8f\xe2\x83\xa3"', b'icon:"1x"')
c = c.replace(b'icon:"\xf0\x9f\x94\x81"', b'icon:"2x"')
c = c.replace(b'icon:"\xf0\x9f\x93\x85"', b'icon:"4x"')
c = c.replace(b'icon:"\xe2\x9a\xa1"', b'icon:"EX"')

with open('src/app/components/subscription/CustomerPlanPage.tsx', 'wb') as f:
    f.write(c)

# Verify
idx = c.find(b'hatchback')
print("Hatchback area:", c[idx+30:idx+80])
print("Done")
