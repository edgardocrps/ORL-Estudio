"""Extract the user's 224-page PDF without altering its embedded medical figures.

Usage: python scripts/extract_atlas.py /path/to/BANCO.pdf
Requires PyMuPDF and Pillow. The PDF itself is not distributed in this repository.
"""
import sys, json, re, hashlib
from pathlib import Path
import fitz

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'assets' / 'atlas'
OUT.mkdir(parents=True, exist_ok=True)
doc = fitz.open(sys.argv[1])

# Titles, classifications and links only. Medical labels are extracted from the PDF.
ROWS = [
('Cráneo: vista anterior','craneo','anatomia','Anterior',[1,2,3,4]),
('Cráneo: vista lateral','craneo','anatomia','Lateral',[1,2,3,4]),
('Forámenes de la base del cráneo','craneo','anatomia','Superior',[5,6,7,8,9,10,27]),
('Arterias carótidas y sus ramas','cuello','anatomia','',[11,12,13,14,15,16,17,18]),
('Vasos superficiales de la cara','craneo','anatomia','',[19,20]),
('Niveles ganglionares cervicales','cuello','anatomia','',[49,50,51,52,53]),
('Oído externo, medio e interno','oido','anatomia','Frontal',[59,60,61,67,80,81]),
('Otoscopia: membrana timpánica normal','oido','otoscopia','',[63,64,65,66]),
('Cavidad timpánica: vasos y nervios','oido','anatomia','',[67,68,69,70,71,72,73,74,75,76,77,78,79]),
('Laberintos óseo y membranoso','oido','anatomia','',[80,81,82,83,84,85,86,87,88]),
('Esqueleto de la nariz','nariz','anatomia','',[190,191]),
('Tabique nasal','nariz','anatomia','Sagital',[193,194,195]),
('Pared lateral de la fosa nasal','nariz','anatomia','Sagital',[196,197,198,199]),
('Senos paranasales','nariz','anatomia','Frontal y transversal',[199,200,201,202,203]),
('Irrigación de la cavidad nasal','nariz','anatomia','',[204,205,206,207,208]),
('Faringe: vista medial','faringe','anatomia','Medial',[255,256,257,258]),
('Faringe: vista posterior abierta','faringe','anatomia','Posterior',[255,256,257,258,259]),
('Fauces e irrigación de la amígdala','faringe','anatomia','',[260,261,262,263,264,269]),
('Espacios parafaríngeos','faringe','anatomia','',[256,274]),
('Cartílagos laríngeos','laringe','anatomia','',[309,310,311,312,313]),
('Músculos intrínsecos de la laringe','laringe','anatomia','',[314,315,324]),
('Nervios y corte frontal de la laringe','laringe','anatomia','Frontal',[316,317,318,319,320,321]),
('Nervio facial y glándula parótida','cuello','anatomia','',[31,388,389]),
('Radiografía: Waters y huesos nasales','nariz','rx','Waters y lateral',[190,201,202]),
('Radiografía: Caldwell y perfil','nariz','rx','Caldwell y lateral',[190,199,201,202]),
('Radiografías de cráneo: PA y Waters','craneo','rx','PA y Waters',[1,2,190,201]),
('Radiografía lateral de cráneo','craneo','rx','Lateral',[1,2,5,190]),
('RM sagital de la faringe','faringe','rm','Sagital',[255,256,266,269]),
('TC sagital: vía aérea y laringe','laringe','tc','Sagital, reconstrucción MPR',[255,256,309,312]),
('RM sagital de nariz y senos','nariz','rm','Sagital',[193,196,199,202]),
('TC coronal 1–2: región anterior','nariz','tc','Coronal · 1–2',[190,193,196,198]),
('TC coronal 3–4: complejo osteomeatal','nariz','tc','Coronal · 3–4',[196,197,198,199,201]),
('TC coronal 5–6: etmoides y órbita','nariz','tc','Coronal · 5–6',[193,196,199,201]),
('TC coronal 7–8: esfenoides y coanas','nariz','tc','Coronal · 7–8',[193,196,199,202,255]),
('TC coronal: meato medio','nariz','tc','Coronal',[196,197,199,201]),
('TC coronal: seno frontal','nariz','tc','Coronal',[197,199,202,203]),
('TC axial: etmoides y esfenoides','nariz','tc','Axial',[193,199,202]),
('TC axial: seno maxilar','nariz','tc','Axial',[193,196,201]),
('TC axial: cavum y región tubárica','faringe','tc','Axial',[255,266]),
('RM del cuello suprahioideo','cuello','rm','Axial y coronal',[255,256,267,268,388]),
('RM de la orofaringe','faringe','rm','Sagital T1 y axial T2',[256,260,262,267,269]),
('RM coronal de la faringe','faringe','rm','Coronal',[255,256,260,266]),
('TC temporal: conducto auditivo interno','oido','tc','Axial',[80,81,82,83]),
('TC temporal: cóclea y protímpano','oido','tc','Axial y coronal',[67,71,80,81]),
('TC temporal: cóclea y nervio facial','oido','tc','Coronal',[71,80,81]),
('TC temporal: huesecillos y vestíbulo','oido','tc','Coronal y sagital',[68,69,70,80,82]),
('TC temporal: vasos y canal facial','oido','tc','Sagital y oblicuo',[71,76,77,78,79]),
('Endoscopia nasal normal','nariz','endoscopia','',[191,193,196,197,198,255]),
('Laringoscopia endoscópica normal','laringe','endoscopia','Inspiración',[309,312,314,315,324,330,331,332]),
]
assert len(ROWS) == 49
blocks_by_page = {}
images = []
for n, page in enumerate(doc, 1):
    blocks = page.get_text('dict')['blocks']
    text = []
    for b in blocks:
        if b['type'] == 0:
            value = '\n'.join(''.join(s['text'] for s in line['spans']) for line in b['lines'])
            text.append({'bbox': b['bbox'], 'text': value})
        elif b['type'] == 1:
            images.append((n, b))
    blocks_by_page[n] = text
assert len(images) == 49, 'Unexpected image count; review the source before extraction.'

figures = []
for index, ((page_number, image), row) in enumerate(zip(images, ROWS), 1):
    title, region, modality, plane, questions = row
    identity = f'fig-{index:03}'
    raw = image['image']
    filename = identity + '.jpg'
    (OUT / filename).write_bytes(raw)
    after = [b for b in blocks_by_page[page_number] if b['bbox'][1] >= image['bbox'][3]-2 and b['bbox'][1] < 750]
    following = next((other['bbox'][1] for p, other in images[index:] if p == page_number), 750)
    after = [b for b in after if b['bbox'][1] < following]
    captions = []
    for b in after:
        txt = re.sub(r'\s+', ' ', b['text']).strip()
        if txt.startswith(('Figura','Netter (')):
            captions.append(txt)
            break
    if not captions:
        raise ValueError(f'Missing caption {identity} page {page_number}')
    guides = []
    if index >= 24:
        # Render only source text beneath this figure, retaining table alignment.
        end = following
        if following < 750:
            headings = [b['bbox'][1] for b in after if not b['text'].startswith('Figura') and b['bbox'][1] > image['bbox'][3]+25 and (b['text'].startswith('5.') or b['text'].startswith('Laringe ('))]
            if headings: end = min(headings)
        selected = [b for b in after if b['bbox'][1] < end]
        if selected:
            bottom = min(750, max(b['bbox'][3] for b in selected)+3)
            top = max(image['bbox'][3], min(b['bbox'][1] for b in selected)-2)
            if bottom-top > 5:
                guide_name = identity + '-guide.png'
                doc[page_number-1].get_pixmap(matrix=fitz.Matrix(2,2),clip=fitz.Rect(50,top,562,bottom),alpha=False).save(OUT/guide_name)
                guides.append({'image':'assets/atlas/'+guide_name,'page':page_number})
        if index == 49:
            name = identity+'-legend.png'
            doc[223].get_pixmap(matrix=fitz.Matrix(2,2),clip=fitz.Rect(50,48,562,176),alpha=False).save(OUT/name)
            guides.append({'image':'assets/atlas/'+name,'page':224})
    notes = []
    if index in [35,36,37,38]:
        notes.append('El anexo advierte que los pies del libro intercambian los términos «axial» y «coronal» en las figuras 24-5 a 24-8. Se conserva la clasificación del anexo y su nota original en la guía de las figuras coronales.')
    if index == 28:
        notes.append('El documento no incluye una radiografía lateral normal del cavum: los ejemplos de los libros mostraban hipertrofia adenoidea. Esta figura es una RM, no una radiografía.')
    figures.append({'id':identity,'title':title,'region':region,'modality':modality,'plane':plane,'image':'assets/atlas/'+filename,'width':image['width'],'height':image['height'],'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest(),'page':page_number,'caption':captions[0],'guides':guides,'notes':notes,'questions':questions})

references = []
for block in doc[223].get_text('dict')['blocks']:
    if block['type'] != 0: continue
    for line in block['lines']:
        if not 240 < line['bbox'][1] < 700: continue
        value = re.sub(r'\s+',' ',''.join(s['text'] for s in line['spans'])).strip()
        if line['bbox'][0] < 60: references.append(value)
        else: references[-1] += ' ' + value
assert len(references) == 14
photos=json.loads((ROOT/'examination.json').read_text())
catalog={'version':1,'source':'BANCO DE PREGUNTAS CON IMAGENES - ORL.pdf','pages':len(doc),'figureCount':len(figures),'mediaBytes':sum(p.stat().st_size for p in OUT.iterdir())+sum(p['bytes'] for p in photos),'examinationPhotos':photos,'references':references,'figures':figures}
(ROOT/'atlas.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n')
print('Extracted',len(figures),'figures;',len(list(OUT.glob('*guide*')))+len(list(OUT.glob('*legend*'))),'source guides;',sum(p.stat().st_size for p in OUT.iterdir()),'bytes')
