with open('src/app/components/subscription/RescheduleTab.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Simplest fix: accept 123456 as master OTP always during demo
old = 'if(otp!==otpGen && !(isDemoPhone && otp===DEMO_OTP)){setOtpErr("Incorrect OTP. Try again.");return;}'
new = 'if(otp!==otpGen && otp!==DEMO_OTP){setOtpErr("Incorrect OTP. Try again.");return;}'
c = c.replace(old, new)

# Also remove the timer expiry block entirely for demo
old2 = 'if(otpTimer===0 && !isDemoPhone){setOtpErr("OTP expired. Request a new one.");return;}'
new2 = '// timer expiry disabled for demo'
c = c.replace(old2, new2)

with open('src/app/components/subscription/RescheduleTab.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print('Done')
