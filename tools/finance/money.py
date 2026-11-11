"""Shared helpers for the Loonars finance tools. Standard library only."""


class InputError(Exception):
    """Raised when an input is missing or malformed. Tools never guess a value."""


def fmt(v, currency="IDR"):
    """Format a money amount. IDR uses Indonesian thousands separators and no decimals."""
    if v is None:
        return "n/a"
    sign = "-" if v < 0 else ""
    if currency == "IDR":
        return "%sRp %s" % (sign, "{:,.0f}".format(abs(round(v))).replace(",", "."))
    return "%s%s %s" % (sign, currency, "{:,.2f}".format(abs(v)))


def pct(v, digits=1):
    return "n/a" if v is None else ("%." + str(digits) + "f%%") % (v * 100)


def num(spec, key, where="input", minimum=None, maximum=None):
    """Read a required number from a dict, refusing missing or invalid values."""
    if key not in spec or spec[key] is None:
        raise InputError("%s: '%s' is missing" % (where, key))
    try:
        v = float(spec[key])
    except (TypeError, ValueError):
        raise InputError("%s: '%s' is not a number: %r" % (where, key, spec[key]))
    if minimum is not None and v < minimum:
        raise InputError("%s: '%s' must be >= %s (got %s)" % (where, key, minimum, v))
    if maximum is not None and v > maximum:
        raise InputError("%s: '%s' must be <= %s (got %s)" % (where, key, maximum, v))
    return v


def total(items, where):
    """Sum a list of {label, cost} items."""
    s = 0.0
    for i, it in enumerate(items or []):
        if not isinstance(it, dict) or "cost" not in it:
            raise InputError("%s[%d] needs a 'cost'" % (where, i))
        s += num(it, "cost", "%s[%d]" % (where, i))
    return s


LABEL_PROJECTION = ("> **[PROJECTION]** Dihitung dari input di bawah, bukan data aktual. "
                    "Angka aktual Loonars bersumber dari AI CFO MKH Property. "
                    "Bukan nasihat finansial, pajak, atau hukum.")
