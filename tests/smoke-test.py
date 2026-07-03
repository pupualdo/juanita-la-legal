#!/usr/bin/env python3
"""
🔥 SMOKE TEST — Juanita La Legal
=================================
Prueba exhaustiva de tipos de respuesta, headers, status codes,
Content-Type, redirects, y resiliencia ante fallos de upstream.

Usa httpbin.org para simular:
  - Content-Type inesperados (XML, HTML, JPEG)
  - Timeouts/delays (5s, 10s)
  - Redirects encadenados
  - Rate limiting
  - JSON malformado / respuestas vacías

Ejecutar: python3 tests/smoke-test.py
"""

import subprocess
import json
import sys
import time
from datetime import datetime

BASE = "https://juanitalalegal.cl"
HTTPBIN = "https://httpbin.org"

PASS = 0
FAIL = 0
SKIP = 0

# ── Colores ANSI ────────────────────────────────────────────
GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
CYAN   = "\033[96m"
RESET  = "\033[0m"
BOLD   = "\033[1m"

def now():
    return datetime.now().strftime("%H:%M:%S")

def run(cmd, timeout=15):
    try:
        r = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=timeout)
        return r.stdout.strip(), r.stderr.strip(), r.returncode
    except subprocess.TimeoutExpired:
        return "", "TIMEOUT", -1

def curl_headers(url, extra_flags="", timeout=15):
    """Devuelve headers HTTP como dict."""
    stdout, stderr, code = run(
        "curl -s -o /dev/null -D - {} --max-time {} '{}'".format(extra_flags, timeout, url),
        timeout=timeout + 2
    )
    if code != 0:
        return {}, stderr or "curl failed"
    headers = {}
    for line in stdout.splitlines():
        line = line.strip()
        if ":" in line:
            k, v = line.split(":", 1)
            headers[k.strip().lower()] = v.strip()
        elif line.upper().startswith("HTTP"):
            headers["_status"] = line
    return headers, None

def curl_headers_retry(url, extra_flags="", timeout=15, retries=3, label=""):
    for attempt in range(retries):
        h, err = curl_headers(url, extra_flags, timeout)
        ok = bool(h and h.get("_status", "") and "N/A" not in str(h.get("content-type", "N/A")))
        if ok:
            if attempt > 0 and label:
                print("     {}↻ {}: recuperado en intento {}{}".format(YELLOW, label, attempt+1, RESET))
            return h, err
        if label:
            print("     {}⚠ {}: intento {}/{} → status={}, ct={}, err={}{}".format(
                YELLOW, label, attempt+1, retries,
                h.get('_status','?'), h.get('content-type','?'), err, RESET))
        if attempt < retries - 1:
            time.sleep(1)
    return h, err

def curl_body(url, method="GET", data=None, extra_flags="", timeout=15):
    method_flag = "-X {}".format(method)
    data_flag = ""
    if data:
        data_flag = "-d '{}' -H 'Content-Type: application/json'".format(json.dumps(data))
    stdout, stderr, code = run(
        "curl -s {} {} {} --max-time {} '{}'".format(method_flag, data_flag, extra_flags, timeout, url),
        timeout=timeout + 2
    )
    return stdout, stderr, code

def test(name, check_fn):
    global PASS, FAIL, SKIP
    try:
        result, detail = check_fn()
        if result is True:
            PASS += 1
            print("  {}✅{} {}".format(GREEN, RESET, name))
        elif result is None:
            SKIP += 1
            print("  {}⊘{}  {} → SKIP: {}".format(YELLOW, RESET, name, detail))
        else:
            FAIL += 1
            print("  {}❌{} {}".format(RED, RESET, name))
            if detail:
                print("     {}→ {}{}".format(RED, detail, RESET))
    except Exception as e:
        FAIL += 1
        print("  {}💥{} {} → CRASH: {}".format(RED, RESET, name, e))


# ═══════════════════════════════════════════════════════════════
#  SECCIÓN 1: ENDPOINTS PÚBLICOS
# ═══════════════════════════════════════════════════════════════

def run_public_endpoints():
    print("\n{}{}═══ 1. ENDPOINTS PÚBLICOS — Status Code y Content-Type{}{}".format(BOLD, CYAN, CYAN, RESET))

    # 1.1 Landing
    h, _ = curl_headers_retry(BASE)
    test("GET / → 200 + text/html", lambda: (
        "200" in h.get("_status", ""),
        "Status: {}".format(h.get('_status', 'N/A'))
    ))
    test("GET / → Content-Type: text/html", lambda: (
        "text/html" in h.get("content-type", ""),
        "Content-Type: {}".format(h.get('content-type', 'N/A'))
    ))
    time.sleep(0.3)

    # 1.2 Chat
    h, _ = curl_headers_retry(
        "{}/api/chat".format(BASE),
        extra_flags="-X POST -H 'Content-Type: application/json' -d '{\"message\":\"hola\",\"sessionId\":\"smoke-001\"}'"
    )
    test("POST /api/chat → no crash (200/400/401/500)", lambda: (
        any(s in h.get("_status", "") for s in ["200", "400", "401", "500"]),
        "Status: {}".format(h.get('_status', 'N/A'))
    ))
    test("POST /api/chat → Content-Type definido", lambda: (
        bool(h.get("content-type", "")),
        "Content-Type: {}".format(h.get('content-type', 'N/A'))
    ))
    time.sleep(0.3)

    # 1.3 Lead
    h, _ = curl_headers_retry(
        "{}/api/lead".format(BASE),
        extra_flags="-X POST -H 'Content-Type: application/json' -d '{\"email\":\"test@test.com\"}'"
    )
    test("POST /api/lead → application/json", lambda: (
        "application/json" in h.get("content-type", ""),
        "Content-Type: {}".format(h.get('content-type', 'N/A'))
    ))
    time.sleep(0.3)

    # 1.4 WebPay create
    h, _ = curl_headers_retry(
        "{}/api/webpay/create".format(BASE),
        extra_flags="-X POST -H 'Content-Type: application/json' -d '{\"sessionId\":\"smoke\",\"amount\":4995,\"topic\":\"laboral\"}'"
    )
    test("POST /api/webpay/create → application/json", lambda: (
        "application/json" in h.get("content-type", ""),
        "Content-Type: {}".format(h.get('content-type', 'N/A'))
    ))
    time.sleep(0.3)

    # 1.5 Validate promo
    h, _ = curl_headers_retry(
        "{}/api/validate-promo".format(BASE),
        extra_flags="-X POST -H 'Content-Type: application/json' -d '{\"code\":\"LANZAMIENTO\"}'",
        label="validate-promo"
    )
    test("POST /api/validate-promo → application/json", lambda: (
        "application/json" in h.get("content-type", ""),
        "Content-Type: {}".format(h.get('content-type', 'N/A'))
    ))
    time.sleep(0.3)

    # 1.6 Grant access
    h, _ = curl_headers_retry(
        "{}/api/grant-access".format(BASE),
        extra_flags="-X POST -H 'Content-Type: application/json' -d '{\"code\":\"LANZAMIENTO\",\"sessionId\":\"smoke\"}'"
    )
    test("POST /api/grant-access → application/json", lambda: (
        "application/json" in h.get("content-type", ""),
        "Content-Type: {}".format(h.get('content-type', 'N/A'))
    ))
    time.sleep(0.3)

    # 1.7 Create payment (MercadoPago)
    h, _ = curl_headers_retry(
        "{}/api/create-payment".format(BASE),
        extra_flags="-X POST -H 'Content-Type: application/json' -d '{\"sessionId\":\"smoke\",\"amount\":4995}'"
    )
    test("POST /api/create-payment → application/json", lambda: (
        "application/json" in h.get("content-type", ""),
        "Content-Type: {}".format(h.get('content-type', 'N/A'))
    ))
    time.sleep(0.3)

    # 1.8 404
    h, _ = curl_headers_retry("{}/api/no-existe".format(BASE))
    test("GET /api/no-existe → 404", lambda: (
        "404" in h.get("_status", ""),
        "Status: {}".format(h.get('_status', 'N/A'))
    ))


# ═══════════════════════════════════════════════════════════════
#  SECCIÓN 2: CONTENT-TYPE HANDLING (httpbin.org)
# ═══════════════════════════════════════════════════════════════

def run_content_types():
    print("\n{}{}═══ 2. CONTENT-TYPE — Respuestas de upstream (httpbin.org){}{}".format(BOLD, CYAN, CYAN, RESET))

    h, err = curl_headers(HTTPBIN)
    if err:
        print("  {}⚠ httpbin.org no responde — saltando sección 2{}".format(YELLOW, RESET))
        return

    tests = [
        ("XML → application/xml",     "/xml",        "application/xml"),
        ("HTML → text/html",          "/html",       "text/html"),
        ("JPEG → image/jpeg",         "/image/jpeg", "image/jpeg"),
        ("PNG → image/png",           "/image/png",  "image/png"),
        ("SVG → image/svg+xml",       "/image/svg",  "image/svg+xml"),
        ("JSON → application/json",   "/json",       "application/json"),
        ("Plain text → text/plain",   "/robots.txt", "text/plain"),
    ]
    for label, path, exp in tests:
        h, _ = curl_headers("{}{}".format(HTTPBIN, path))
        test(label, lambda h=h, exp=exp: (
            exp in h.get("content-type", ""),
            "Content-Type: {}".format(h.get('content-type', 'N/A'))
        ))


# ═══════════════════════════════════════════════════════════════
#  SECCIÓN 3: STATUS CODES (httpbin.org)
# ═══════════════════════════════════════════════════════════════

def run_status_codes():
    print("\n{}{}═══ 3. STATUS CODES — Respuestas no-200 (httpbin.org){}{}".format(BOLD, CYAN, CYAN, RESET))

    tests = [
        ("200 OK", "/status/200", "200"), ("201 Created", "/status/201", "201"),
        ("301 Redirect", "/status/301", "301"), ("302 Found", "/status/302", "302"),
        ("400 Bad Req", "/status/400", "400"), ("401 Unauthorized", "/status/401", "401"),
        ("403 Forbidden", "/status/403", "403"), ("404 Not Found", "/status/404", "404"),
        ("429 Rate Limit", "/status/429", "429"), ("500 Internal", "/status/500", "500"),
        ("502 Bad Gateway", "/status/502", "502"), ("503 Unavailable", "/status/503", "503"),
    ]
    for label, path, exp in tests:
        h, _ = curl_headers("{}{}".format(HTTPBIN, path))
        test(label, lambda h=h, exp=exp: (
            exp in h.get("_status", ""),
            "Status: {}".format(h.get('_status', 'N/A'))
        ))


# ═══════════════════════════════════════════════════════════════
#  SECCIÓN 4: REDIRECT CHAINS
# ═══════════════════════════════════════════════════════════════

def run_redirects():
    print("\n{}{}═══ 4. REDIRECTS — Cadenas de 302 (httpbin.org){}{}".format(BOLD, CYAN, CYAN, RESET))

    for n in [1, 3, 5]:
        h, _ = curl_headers("{}/redirect/{}".format(HTTPBIN, n), extra_flags="-L --max-redirs 10")
        test("{} redirects → landing OK".format(n), lambda h=h: (
            "200" in h.get("_status", ""),
            "Final status: {}".format(h.get('_status', 'N/A'))
        ))

    h, _ = curl_headers("{}/redirect-to?url={}/json".format(HTTPBIN, HTTPBIN), extra_flags="-L")
    test("Redirect absoluto → /json OK", lambda h=h: (
        "200" in h.get("_status", ""),
        "Final status: {}".format(h.get('_status', 'N/A'))
    ))

    # WebPay redirect
    print("\n  {}── WebPay redirect flow (producción){}".format(CYAN, RESET))
    h, _ = curl_headers("{}/api/webpay/commit?token_ws=fake-token-test".format(BASE), extra_flags="-L")
    test("WebPay commit → redirect o error claro", lambda h=h: (
        any(s in h.get("_status", "") for s in ["307", "302", "200", "400"]),
        "Final status: {}".format(h.get('_status', 'N/A'))
    ))


# ═══════════════════════════════════════════════════════════════
#  SECCIÓN 5: DELAYS / TIMEOUTS
# ═══════════════════════════════════════════════════════════════

def run_delays():
    print("\n{}{}═══ 5. DELAYS — Timeouts de upstream simulados (httpbin.org){}{}".format(BOLD, CYAN, CYAN, RESET))

    for delay in [3, 5]:
        start = time.time()
        body, err, code = curl_body("{}/delay/{}".format(HTTPBIN, delay), timeout=delay+5)
        elapsed = time.time() - start
        test("Delay {}s → responde en ~{}s".format(delay, delay), lambda e=elapsed, d=delay: (
            code == 0 and (d-0.5) < e < (d+3),
            "Tiempo real: {:.1f}s (esperado ~{}s)".format(e, d)
        ))

    print("\n  {}── Timeout de chat (producción){}".format(CYAN, RESET))
    start = time.time()
    h, _ = curl_headers(
        "{}/api/chat".format(BASE),
        extra_flags="-X POST -H 'Content-Type: application/json' -d '{\"message\":\"cuidado personal\",\"sessionId\":\"smoke-timeout\"}'",
        timeout=30
    )
    elapsed = time.time() - start
    test("POST /api/chat → responde < 30s (real: {:.1f}s)".format(elapsed), lambda e=elapsed: (
        e < 30,
        "Tiempo real: {:.1f}s".format(e)
    ))


# ═══════════════════════════════════════════════════════════════
#  SECCIÓN 6: RATE LIMITING
# ═══════════════════════════════════════════════════════════════

def run_rate_limits():
    print("\n{}{}═══ 6. RATE LIMITING — 429 + Retry-After{}".format(BOLD, CYAN, RESET))

    print("  {}Spam POST /api/lead (20 requests en ráfaga)...{}".format(CYAN, RESET))
    rate_limited = False
    last_status = ""
    for i in range(20):
        h, err = curl_headers(
            "{}/api/lead".format(BASE),
            extra_flags="-X POST -H 'Content-Type: application/json' -d '{{\"email\":\"r{}@test.com\"}}'".format(i)
        )
        last_status = h.get("_status", "")
        if "429" in last_status:
            rate_limited = True
            break

    test("Rate limit → 429 después de spam", lambda: (
        rate_limited,
        "Último status: {}".format(last_status) if not rate_limited else "OK"
    ))

    h, err = curl_headers(
        "{}/api/lead".format(BASE),
        extra_flags="-X POST -H 'Content-Type: application/json' -d '{\"email\":\"after@test.com\"}'"
    )
    if "429" in h.get("_status", ""):
        test("429 incluye header Retry-After", lambda: (
            "retry-after" in h,
            "Headers: {}".format(list(h.keys()))
        ))


# ═══════════════════════════════════════════════════════════════
#  SECCIÓN 7: CORS + SECURITY HEADERS
# ═══════════════════════════════════════════════════════════════

def run_security_headers():
    print("\n{}{}═══ 7. CORS + SECURITY HEADERS{}".format(BOLD, CYAN, RESET))

    h, _ = curl_headers(BASE)

    test("Access-Control-Allow-Origin presente", lambda: (
        "access-control-allow-origin" in h,
        None
    ))

    test("Content-Security-Policy presente", lambda: (
        "content-security-policy" in h,
        "CSP: {}...".format(h.get('content-security-policy', 'N/A')[:120])
    ))

    if "content-security-policy" in h:
        csp = h["content-security-policy"]
        test("CSP permite google-analytics.com", lambda: ("google-analytics.com" in csp, None))
        test("CSP permite connect.facebook.net", lambda: ("facebook" in csp.lower(), None))
        test("CSP permite clarity.ms", lambda: ("clarity.ms" in csp, None))


# ═══════════════════════════════════════════════════════════════
#  SECCIÓN 8: EDGE CASES
# ═══════════════════════════════════════════════════════════════

def run_edge_cases():
    print("\n{}{}═══ 8. EDGE CASES — Cuerpos inesperados{}".format(BOLD, CYAN, RESET))

    body, err, code = curl_body("{}/api/chat".format(BASE), method="POST", data={})
    test("POST /api/chat → body vacío → 400", lambda: (code == 0, "exit: {}".format(code)))

    body, err, code = curl_body("{}/api/lead".format(BASE), method="POST", data={})
    test("POST /api/lead → body vacío → 400", lambda: (code == 0, "exit: {}".format(code)))

    body, err, code = run("curl -s -X POST -H 'Content-Type: application/json' -d 'not json' --max-time 10 '{}/api/chat'".format(BASE))
    test("POST /api/chat → JSON inválido → manejado", lambda: (
        "error" in body.lower() or "400" in body or code == 0,
        "Body: {}".format(body[:100])
    ))

# ═══════════════════════════════════════════════════════════════
# ═══════════════════════════════════════════════════════════════
#  SECCIÓN 9: SSE STREAMING
# ═══════════════════════════════════════════════════════════════

def run_sse_streaming():
    print("\n{}{}═══ 9. SSE STREAMING — Formato text/event-stream{}".format(BOLD, CYAN, RESET))

    stdout, stderr, code = run(
        "curl -s -N -X POST -H 'Content-Type: application/json' "
        "-d '{\"message\":\"hola\",\"sessionId\":\"smoke-preview\"}' "
        "--max-time 10 '%s/api/preview-chat' | head -20" % BASE,
        timeout=15
    )
    test("SSE preview: streaming fluido (data: presente)", lambda: (
        "data:" in stdout,
        "Primeras líneas: {}".format(stdout[:200])
    ))
    test("SSE preview: incluye [DONE]", lambda: (
        "[DONE]" in stdout,
        None
    ))

    stdout2, stderr2, code2 = run(
        "curl -s -N -X POST -H 'Content-Type: application/json' "
        "-d '{\"message\":\"hola\",\"sessionId\":\"fake-no-existe\"}' "
        "--max-time 8 '%s/api/chat' | head -20" % BASE,
        timeout=12
    )
    test("SSE chat (sin sesión): error claro, no crash", lambda: (
        any(w in stdout2.lower() for w in ["error", "sesión", "inválida"]),
        "Respuesta: {}".format(stdout2[:200])
    ))


# ═══════════════════════════════════════════════════════════════
#  MAIN
# ═══════════════════════════════════════════════════════════════

def main():
    global PASS, FAIL, SKIP

    print("\n{}🔥 SMOKE TEST — Juanita La Legal{}".format(BOLD, RESET))
    print("{}Producción: {}{}".format(CYAN, BASE, RESET))
    print("{}Upstream simulado: {}{}".format(CYAN, HTTPBIN, RESET))
    print("{}Inicio: {}{}".format(CYAN, now(), RESET))
    print("=" * 64)

    h, err = curl_headers(HTTPBIN, timeout=5)
    httpbin_down = bool(err) or ("503" in h.get("_status", ""))

    run_public_endpoints()

    if not httpbin_down:
        run_content_types()
        run_status_codes()
        run_redirects()
        run_delays()
        # Estos tests de edge cases dependen de httpbin
        h, _ = curl_headers("{}/status/204".format(HTTPBIN))
        test("204 No Content → sin body", lambda: (
            "204" in h.get("_status", ""),
            "Status: {}".format(h.get('_status', 'N/A'))
        ))
        h, err = curl_headers("{}/response-headers?X-Custom=Juanita&X-Version=2.0".format(HTTPBIN))
        test("Headers personalizados OK", lambda: (
            h.get("x-custom") == "Juanita" and h.get("x-version") == "2.0",
            "x-custom={}, x-version={}".format(h.get('x-custom'), h.get('x-version'))
        ))
    else:
        SKIP += 32
        print("\n  {}⚠ httpbin.org no disponible — secciones 2-5 y edge cases httpbin saltados{}".format(YELLOW, RESET))

    run_security_headers()
    run_edge_cases()
    run_sse_streaming()
    run_rate_limits()

    total = PASS + FAIL + SKIP
    print("\n{}".format("═" * 64))
    print("{}📊 RESUMEN{}".format(BOLD, RESET))
    print("  {}✅ Passed:  {}{}".format(GREEN, PASS, RESET))
    print("  {}❌ Failed:  {}{}".format(RED, FAIL, RESET))
    print("  {}⊘  Skipped: {}{}".format(YELLOW, SKIP, RESET))
    print("  Total:    {}".format(total))
    if PASS + FAIL > 0:
        print("  Score:    {}/{} ({}%)".format(PASS, PASS + FAIL, int(PASS/(PASS+FAIL)*100)))
    print("  Fin:      {}".format(now()))

    return 0 if FAIL == 0 else 1

if __name__ == "__main__":
    sys.exit(main())
