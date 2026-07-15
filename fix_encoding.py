with open('src/app/components/subscription/CustomerPlanPage.tsx', 'rb') as f:
    raw = f.read()

# The file was saved as UTF-8 but read as Latin-1 and re-saved
# So each UTF-8 multi-byte sequence was treated as individual Latin-1 chars
# and re-encoded. We need to decode as Latin-1 to get original bytes back.
try:
    # Decode as latin-1 to get the original byte values back
    text = raw.decode('latin-1')
    # The original file was UTF-8, so now re-encode as latin-1 to get original UTF-8 bytes
    original_bytes = text.encode('latin-1')
    # Now decode as UTF-8 to verify
    final_text = original_bytes.decode('utf-8')
    print("SUCCESS - first 3 lines:")
    for line in final_text.split('\n')[:3]:
        print(repr(line))
    with open('src/app/components/subscription/CustomerPlanPage.tsx', 'w', encoding='utf-8') as f:
        f.write(final_text)
    print("File restored!")
except Exception as e:
    print("Error:", e)
    # Try double latin-1 decode
    try:
        text = raw.decode('latin-1')
        original_bytes = text.encode('latin-1')
        text2 = original_bytes.decode('latin-1')
        original_bytes2 = text2.encode('latin-1')
        final_text = original_bytes2.decode('utf-8')
        print("Double decode SUCCESS:")
        for line in final_text.split('\n')[:3]:
            print(repr(line))
    except Exception as e2:
        print("Double decode error:", e2)
