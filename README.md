# ORL Estudio

Aplicación web instalable para preparar el ingreso al posgrado de otorrinolaringología. Funciona como un sitio estático independiente de ChatGPT y no utiliza la API de OpenAI.

## Estudio

- 464 preguntas originales en ocho bloques: 370 abiertas y 94 de selección simple.
- Tarjetas con respuesta escrita opcional, autoevaluación e intervalos de repaso.
- Preguntas de selección con corrección automática y simulacros cronometrados.
- Favoritos, repaso de errores, seis fichas y dos mapas interactivos.
- Atlas visual con las 49 figuras del PDF: anatomía, irrigación, radiografías, TC, RM, otoscopia y endoscopia.
- Exploración física con vistas normales de otoscopia, endoscopia nasal y laringoscopia del documento.
- Ampliación y desplazamiento, leyendas originales, preguntas relacionadas, favoritos y autoevaluación visual separada de los aciertos de selección.
- Descarga opcional de las figuras y leyendas (aprox. 10,8 MB) para estudiar sin conexión.
- Perfil local con nombre o alias, etapa de formación y centro de estudios opcional.
- Progreso, estadísticas y copias de respaldo en JSON.

Los datos personales y el progreso se guardan en el navegador de cada dispositivo. No se sincronizan automáticamente. Para trasladarlos, exporta una copia desde Ajustes e impórtala en el otro dispositivo o dirección web.

## Publicación en GitHub Pages

Publicar la rama `main` desde la carpeta raíz `/` en Settings → Pages → Deploy from a branch. El archivo `.nojekyll` permite servir los archivos estáticos directamente. Las rutas admiten tanto la raíz de un dominio como una subcarpeta de proyecto.

Abrir el sitio en Chrome para Android y utilizar Instalar aplicación o Añadir a pantalla de inicio. El funcionamiento sin conexión se activa después de descargar por completo la aplicación y el banco; el estado se consulta en Ajustes.

## Validación y mantenimiento

No necesita dependencias para ejecutarse. Para verificar puntuación, perfiles, restauración y funcionamiento sin conexión, ejecutar `node --test tests/*.test.js`.

Después de modificar los archivos publicados, ejecutar `python3 scripts/build_sw.py` para actualizar la versión de caché antes de subirlos a GitHub. El service worker limita su alcance a esta aplicación y no intercepta otras páginas del dominio.

## Contenido

Las preguntas, claves, respuestas y referencias se conservan del banco aportado por su autor. No se han añadido respuestas médicas nuevas ni realizado una revisión clínica independiente. Las diferencias entre libros se mantienen en cada respuesta. El documento Word original y el PDF completo no se publican en este repositorio.

Las figuras se extraen del PDF aportado, sin modificar sus bytes, y conservan el pie de fuente y las notas del anexo. Las leyendas se renderizan desde la página original para preservar la alineación de rótulos y tablas. No se ocultan los rótulos incrustados en la imagen. El anexo es de anatomía normal; no se han añadido diagnósticos nuevos a las imágenes.


Para reproducir la extracción local: `python scripts/extract_atlas.py /ruta/al/banco.pdf` (PyMuPDF). Después, regenerar `sw.js`.

