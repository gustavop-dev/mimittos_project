from django.template.loader import render_to_string


def render_email_html(*, heading, paragraphs, details=None, cta=None,
                      code=None, footer_note=None, preheader=None,
                      subject=None):
    """
    Render the branded MIMITTOS HTML email shell.

    All keyword args. Pass only what each email needs.

      heading:     str — main title shown big at the top
      paragraphs:  list[str] — body paragraphs
      details:     list[{label,value}] — optional key/value rows
      cta:         {text,url} — optional call-to-action button
      code:        str — optional verification/reset code (rendered as a chip)
      footer_note: str — optional small grey text under the body
      preheader:   str — optional inbox preview text
      subject:     str — optional <title> tag value

    Returns the rendered HTML string. Pair it with the existing plain-text
    body via send_mail(..., html_message=...) so plain-text clients still
    get the friendly Spanish copy.
    """
    context = {
        'heading': heading,
        'paragraphs': paragraphs or [],
        'details': details or [],
        'cta_url': (cta or {}).get('url'),
        'cta_text': (cta or {}).get('text'),
        'code': code,
        'footer_note': footer_note,
        'preheader': preheader,
        'subject': subject or heading,
    }
    return render_to_string('emails/base.html', context)
