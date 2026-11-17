import subprocess, sys

F = '/Users/apple/Library/Accio/external-tools/v7dccae0500c8/python/lib/python3.12/site-packages/imageio_ffmpeg/binaries/ffmpeg-macos-x86_64-v7.1'
HARD = chr(92) + 'N'   # ASS/subtitle-style hard line break for our renderer

lines = [
    'గత నెలలో మీ WhatsApp, IndiaMART, JustDial కి వచ్చిన',
    'ఎన్‌క్వైరీలో ఎన్నింటికి ఎవరూ రిప్లై ఇవ్వలేదు?',
]
txt = HARD.join(lines)

subprocess.run(['./render_text', '--out', 'overlays/mock_cap2.png',
                '--font', 'TeluguMN',
                '--fontfile', '/System/Library/Fonts/Supplemental/Telugu MN.ttc',
                '--size', '108', '--maxwidth', '1780', '--align', 'center',
                '--fill', '#FFFFFF', '--strokew', '7', '--stroke', '#0A1219',
                '--lineheight', '1.36', '--pad', '16', '--text', txt], check=True)

cap_bottom = int(0.70 * 3840)
card_y = int(0.150 * 3840)
fc = (f'[1]scale=1620:-1[card];[2]scale=1760:-1[cap];'
      f'[0][card]overlay=x=(W-w)/2:y={card_y}[t1];'
      f'[t1][cap]overlay=x=(W-w)/2:y={cap_bottom}-h[out]')
subprocess.run([F, '-hide_banner', '-loglevel', 'error',
                '-i', 'grade/mock_base.png',
                '-i', 'overlays/onscreen_A.png',
                '-i', 'overlays/mock_cap2.png',
                '-filter_complex', fc, '-map', '[out]',
                '-frames:v', '1', 'grade/mock_layout2.png', '-y'], check=True)
print('OK')
