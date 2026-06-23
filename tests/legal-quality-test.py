#!/usr/bin/env python3
"""
🔍 LEGAL QUALITY TEST — Juanita La Legal
==========================================
Envía consultas legales reales a preview-chat y verifica
que las respuestas no contengan errores prohibidos.

Ejecutar: python3 tests/legal-quality-test.py
"""

import subprocess
import json
import sys
import time

BASE = "https://juanitalalegal.cl"
PREVIEW = f"{BASE}/api/preview-chat"

PASS = 0
FAIL = 0
WARN = 0

# ── Colores ──
G = "\033[92m"; R = "\033[91m"; Y = "\033[93m"; C = "\033[96m"; B = "\033[1m"; X = "\033[0m"

# ═══════════════════════════════════════════
# QUERIES DE PRUEBA
# ═══════════════════════════════════════════

QUERIES = [
    # Familia
    ("familia_divorcio", "Me quiero divorciar, ¿quién se queda con los niños?"),
    ("familia_pension", "¿Cómo demando por pensión de alimentos?"),
    ("familia_vif", "Mi pareja me grita y me empuja, ¿qué hago?"),
    ("familia_visitas", "No me dejan ver a mis hijos los fines de semana"),
    ("familia_tuicion_trampa", "Quiero pedir la tuición de mi hijo, ¿cómo se hace?"),  # ← debe decir "cuidado personal"

    # Laboral
    ("laboral_despido", "Me despidieron sin aviso, ¿tengo derecho a algo?"),
    ("laboral_horas", "Trabajo 12 horas diarias y no me pagan extras"),
    ("laboral_contrato", "Nunca me hicieron contrato, ¿es legal?"),
    ("laboral_renuncia", "Quiero renunciar pero me deben 3 meses de sueldo"),
    ("laboral_acoso", "Mi jefe me acosa en el trabajo, ¿qué puedo hacer?"),

    # Arriendo
    ("arriendo_termino", "El dueño me quiere echar del departamento, ¿puede?"),
    ("arriendo_no_pago", "Llevo 2 meses sin pagar arriendo, ¿me pueden desalojar?"),
    ("arriendo_garantia", "No me devuelven el mes de garantía, ¿cómo lo exijo?"),

    # Consumidor
    ("consumidor_garantia", "Compré un celular y salió malo, ¿me lo tienen que cambiar?"),
    ("consumidor_estafa", "Me estafaron por internet, pagué y no me enviaron nada"),
    ("consumidor_retracto", "Compré algo online y me arrepentí, ¿puedo devolverlo?"),
    ("consumidor_boleta", "No me quisieron dar boleta, ¿es ilegal?"),

    # Herencia
    ("herencia_testamento", "Mi papá murió sin testamento, ¿cómo se reparte?"),
    ("herencia_deudas", "¿Las deudas se heredan en Chile?"),

    # Penal
    ("penal_denuncia", "Quiero poner una denuncia por robo, ¿dónde voy?"),
    ("penal_defensa", "Me están acusando de algo que no hice, ¿qué hago?"),

    # Migración
    ("migracion_visa", "Soy extranjero, ¿cómo saco la visa en Chile?"),
    ("migracion_ser mig", "¿Qué hace el SERMIG?"),  # ← verificamos que diga SERMIG, no DEM

    # Varios
    ("varios_empleada", "Mi empleada doméstica tuvo un accidente en mi casa"),
    ("varios_salud", "Me operaron mal en una clínica, ¿puedo demandar?"),
    ("varios_slang", "Me chocaron el auto y el weón se arrancó"),  # slang chileno
    ("varios_typo", "Nesecito saver como se divorcia uno"),  # typos
    ("varios_empresa", "Quiero crear una empresa, ¿qué tipo me conviene?"),
    ("varios_coche_auto", "Tuve un choque de coche, ¿qué hago?"),  # "choque" → claramente auto
    ("varios_coche_bebe", "Se me rompió el coche de la guagua, ¿tiene garantía?"),  # "guagua" → carro de bebé
]
# ═══════════════════════════════════════════════
# REGLAS PROHIBIDAS
# ═══════════════════════════════════════════════

RULES = [
    {
        "id": "NO_TUICION",
        "pattern": "tuición",
        "severity": "fail",
        "msg": "Dijo 'tuición' en vez de 'cuidado personal'"
    },
    {
        "id": "NO_VOSEO",
        "patterns": ["tenés", "podés", "probás", "necesitás", "querés", "sabés",
                      "decís", "hacés", "ponés", "salís", "venís"],
        "severity": "fail",
        "msg": "Voseo argentino detectado"
    },
    {
        "id": "NO_BRACKETS",
        "pattern": r"[\[].*?[\]]",  # cualquier texto entre corchetes
        "exceptions": ["[DONE]"],
        "severity": "fail",
        "msg": "Texto entre corchetes tipo [link falso]"
    },
    {
        "id": "NO_ANTHROPIC",
        "patterns": ["Claude", "Anthropic", "modelo de lenguaje", "inteligencia artificial"],
        "severity": "fail",
        "msg": "Reveló que es una IA"
    },
    {
        "id": "NO_DEM",
        "pattern": "DEM",
        "context_check": "departamento de extranjería",
        "severity": "fail",
        "msg": "Dijo 'DEM' en vez de 'SERMIG'"
    },
    {
        "id": "COCHE_CHILENO",
        "trigger_query": "varios_coche_bebe",  # solo la query sin contexto automotriz dispara esta regla
        "check": lambda text: (
            "carro de bebé" not in text.lower()
            and "cochecito" not in text.lower()
            and "guagua" not in text.lower()
            and "bebé" not in text.lower()
            and "criatura" not in text.lower()
        ),
        "severity": "warn",
        "msg": "Interpretó 'coche' como auto (OK si hay contexto: choque/tránsito/seguro)"
    },
    {
        "id": "NO_MEXICANISMOS",
        "patterns": ["órale", "ahorita", "platicar", "checar", "qué onda", "chido",
                      "güey", "wey", "neta", "chingón", "padre", "no mames"],
        "severity": "fail",
        "msg": "Mexicanismo detectado"
    },
    {
        "id": "NO_ESPANOLISMOS",
        "patterns": ["vale", " tío ", "guay", "molar", "flipar", "hostia"],
        "severity": "fail",
        "msg": "Españolismo detectado"
    },
]


# ═══════════════════════════════════════════════

def query_juanita(message):
    """Envía una consulta a preview-chat y junta la respuesta completa"""
    cmd = (
        f"curl -s -N -X POST -H 'Content-Type: application/json' "
        f"-d '{json.dumps({'message': message, 'sessionId': f'quality-{int(time.time())}'})}' "
        f"--max-time 25 '{PREVIEW}'"
    )
    try:
        r = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=30)
        # Parsear líneas "data: {...}" del SSE
        texts = []
        for line in r.stdout.split("\n"):
            line = line.strip()
            if line.startswith("data: "):
                try:
                    data = json.loads(line[6:])
                    if "text" in data:
                        texts.append(data["text"])
                except:
                    pass
        return "".join(texts)
    except Exception as e:
        return f"ERROR: {e}"


def check_response(text, query_id):
    """Revisa todas las reglas contra la respuesta"""
    violations = []

    for rule in RULES:
        rid = rule["id"]

        # Solo aplicar reglas específicas de query
        if "trigger_query" in rule and rule["trigger_query"] != query_id:
            continue

        # Check pattern(s)
        patterns = rule.get("patterns", [])
        if "pattern" in rule:
            patterns.append(rule["pattern"])

        for pat in patterns:
            if pat in text.lower():
                # Verificar excepciones
                if "exceptions" in rule:
                    if any(exc in text for exc in rule["exceptions"]):
                        continue
                violations.append(f"{rule['severity'].upper()}: {rule['msg']}")
                break

        # Custom check function
        if "check" in rule and rule["check"](text):
            violations.append(f"{rule['severity'].upper()}: {rule['msg']}")

    return violations


def main():
    global PASS, FAIL, WARN

    print(f"\n{B}🔍 LEGAL QUALITY TEST — Juanita La Legal{X}")
    print(f"{C}Consultas: {len(QUERIES)}{X}")
    print(f"{C}Reglas: {len(RULES)}{X}")
    print("=" * 64)

    start = time.time()
    total_violations = 0

    for i, (qid, query) in enumerate(QUERIES, 1):
        sys.stdout.write(f"\n  [{i}/{len(QUERIES)}] {qid}: ")
        sys.stdout.flush()

        response = query_juanita(query)

        if response.startswith("ERROR:"):
            print(f"{Y}⚠{X} {response}")
            WARN += 1
            time.sleep(1)
            continue

        violations = check_response(response, qid)

        if not violations:
            print(f"{G}✓{X}")
            PASS += 1
        else:
            fail_count = sum(1 for v in violations if v.startswith("FAIL:"))
            warn_count = sum(1 for v in violations if v.startswith("WARN:"))
            total_violations += len(violations)

            if fail_count > 0:
                print(f"{R}✗{X} {fail_count} error(es)")
                FAIL += fail_count
            if warn_count > 0:
                WARN += warn_count

            for v in violations:
                tag = f"{R}  ▶{X}" if v.startswith("FAIL:") else f"{Y}  ▶{X}"
                print(f"{tag} {v}")

        time.sleep(0.8)  # No sobrecargar

    elapsed = time.time() - start

    # ── Resumen ──
    print(f"\n{'═' * 64}")
    print(f"{B}📊 RESUMEN LEGAL{X}")
    print(f"  Consultas enviadas: {len(QUERIES)}")
    print(f"  {G}Sin violaciones:   {PASS}{X}")
    print(f"  {R}Con violaciones:   {FAIL}{X}")
    print(f"  {Y}Warnings:          {WARN}{X}")
    print(f"  Tiempo:           {elapsed:.0f}s")

    if FAIL == 0 and WARN == 0:
        print(f"\n  {G}{B}✅ PERFECTO — 0 violaciones en {len(QUERIES)} consultas{X}")
    elif FAIL == 0:
        print(f"\n  {Y}{B}⚠ OK con warnings — {WARN} avisos en {len(QUERIES)} consultas{X}")
    else:
        print(f"\n  {R}{B}❌ {FAIL} VIOLACIONES detectadas — requiere fix{X}")

    return 0 if FAIL == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
