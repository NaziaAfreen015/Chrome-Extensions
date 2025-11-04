# curl -X POST 'https://script.google.com/macros/s/AKfycbwug-RwVRRbM2rhNWtygZ8zgXVEI_50Fm_APNMTCywUXNGQdrd0D08pdSy76M7_vgpX/exec' \
#   -H 'Content-Type: application/json' \
#   -d '{
#         "schemaVersion":1,
#         "ts": 1730611200000,
#         "domain":"wikipedia.org",
#         "url":"https://en.wikipedia.org/wiki/...",
#         "answers": {"q1":"3 stars","q2":"Yes","q3":"Nice!"}
#       }'


curl -L --post301 --post302 --post303 \
  -H 'Content-Type: text/plain;charset=utf-8' \
  -X POST 'https://script.google.com/macros/s/AKfycbxj0mWoGtpR9VtehnEoSJtyoAFclfqtPYR48TF6ZVdIAzUzk0sLJoVSda5LudLfxcFB/exec' \
  --data '{"schemaVersion":1,"ts":1730611200000,"domain":"wikimedia.org","url":"https://en.wikipedia.org/wiki/...","answers":{"q1":"3 stars","q2":"Yes","q3":"Nice!"}}'
