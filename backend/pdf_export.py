import io
from datetime import datetime
from collections import defaultdict
from decimal import Decimal
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


def generate_inventory_pdf(items):
    buffer = io.BytesIO()

    document = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36,
    )

    styles = getSampleStyleSheet()
    elements = []

    def safe_text(value):
        return escape(str(value)) if value is not None else "N/A"

    def money(value):
        if value is None:
            return "N/A"
        return f"${Decimal(str(value)):,.2f}"

    # Calculate inventory totals
    total_quantity = sum(
        item.get("quantity") or 1 for item in items
    )

    total_value = Decimal("0")

    for item in items:
        value = item.get("current_value")

        if value is None:
            value = item.get("purchase_price")

        quantity = item.get("quantity") or 1
        total_value += Decimal(str(value or 0)) * quantity

    # Report heading
    elements.append(
        Paragraph("ReCovered", styles["Title"])
    )

    elements.append(
        Paragraph("Home Inventory Report", styles["Heading1"])
    )

    elements.append(
        Paragraph(
            f"Date generated: {datetime.now().strftime('%B %d, %Y')}",
            styles["Normal"],
        )
    )

    elements.append(Spacer(1, 16))

    # Inventory summary
    summary = [
        ["Total Assets", "Total Inventory Value"],
        [str(total_quantity), money(total_value)],
    ]

    summary_table = Table(
        summary,
        colWidths=[270, 270],
    )

    summary_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#243B53")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("BACKGROUND", (0, 1), (-1, 1), colors.HexColor("#F0F4F8")),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 1), (-1, 1), 14),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
    ]))

    elements.append(summary_table)
    elements.append(Spacer(1, 20))

    # Group inventory by room
    rooms = defaultdict(list)

    for item in items:
        room = item.get("room_location") or "Unassigned Room"
        rooms[room].append(item)

    if not items:
        elements.append(
            Paragraph(
                "No inventory items have been added.",
                styles["Normal"],
            )
        )

    # Generate each room section
    for room, room_items in sorted(rooms.items()):

        elements.append(
            Paragraph(safe_text(room), styles["Heading1"])
        )

        for item in room_items:

            elements.append(
                Paragraph(
                    safe_text(item.get("name")),
                    styles["Heading2"],
                )
            )

            details = [
                ["Category", safe_text(item.get("category"))],
                ["Brand", safe_text(item.get("brand"))],
                ["Model", safe_text(item.get("model"))],
                ["Serial Number", safe_text(item.get("serial_number"))],
                ["Condition", safe_text(item.get("condition"))],
                ["Quantity", str(item.get("quantity") or 1)],
                ["Purchase Price", money(item.get("purchase_price"))],
                ["Current Value", money(item.get("current_value"))],
                ["Description", safe_text(item.get("notes"))],
            ]

            details = [
                [label, Paragraph(value, styles["Normal"])]
                for label, value in details
            ]

            item_table = Table(
                details,
                colWidths=[120, 420],
                splitByRow=1,
                splitInRow=1,
            )

            item_table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#F0F4F8")),
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.lightgrey),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]))

            elements.append(item_table)
            elements.append(Spacer(1, 16))

    # Page numbering
    def add_page_number(canvas, doc):
        canvas.saveState()
        canvas.setFont("Helvetica", 9)
        canvas.setFillColor(colors.grey)

        canvas.drawString(
            36, 20, "ReCovered | Home Inventory Report"
        )

        canvas.drawRightString(
            576, 20, f"Page {doc.page}"
        )

        canvas.restoreState()

    # Build the PDF
    document.build(
        elements,
        onFirstPage=add_page_number,
        onLaterPages=add_page_number,
    )

    buffer.seek(0)

    return buffer