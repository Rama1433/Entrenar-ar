# Músculos trabajados · Catálogo inicial

La aplicación incluye seis ejercicios de referencia. Los datos se completan al elegir uno del catálogo o al reconocer exactamente su nombre o alguno de sus alias. Los ejercicios anteriores sin campos musculares muestran esa referencia solo cuando el nombre coincide. No se analizan videos ni se consulta internet desde la app.

El profesor puede ajustar las selecciones. Un ejercicio personalizado sin coincidencia queda sin músculos especificados hasta completarlo. Una selección vacía guardada por el profesor se respeta. No se deducen músculos a partir del grupo general (Piernas, Core, etc.) ni de nombres parciales.

Los grupos son una síntesis orientativa para una silueta esquemática, no una medición de activación. La división entre principales y secundarios puede variar con la técnica o la variante. No se muestran porcentajes de activación ni tiempos de recuperación.

## Referencias consultadas el 11 de noviembre de 2026

- Sentadilla goblet: NASM, Goblet Squat. https://www.nasm.org/resource-center/exercise-library/goblet-squat
- Remo con mancuerna: ACE, Single-arm Row. https://www.acefitness.org/resources/everyone/exercise-library/126/single-arm-row/
- Plancha abdominal: NASM, Plank. https://www.nasm.org/resource-center/exercise-library/plank
- Press de hombros: ACE, Seated Overhead Press. https://www.acefitness.org/resources/everyone/exercise-library/45/seated-overhead-press/
- Puente de glúteos: NASM, Floor Bridge. https://www.nasm.org/resource-center/exercise-library/floor-bridge
- Flexiones de brazos: NASM, Push-Up. https://www.nasm.org/resource-center/exercise-library/push-up

La clasificación en los grupos simplificados de Entrenar es una adaptación editorial de estas referencias. El profesor debe revisarla si utiliza otra variante. La silueta neutra es original de Entrenar. Desde V1.9.17 las figuras masculina y femenina se adaptaron de react-native-body-highlighter, bajo licencia MIT incluida; ver FIGURAS.md. No se copiaron imágenes, videos ni texto de las referencias de ejercicios.

## Persistencia y seguridad

Ejecutar setup/Entrenar_07_Musculos_Ejercicios.sql en Supabase antes de publicar V1.9.16. Agrega primary_muscles y secondary_muscles a ent_exercises, valida los identificadores permitidos y habilita su actualización bajo las políticas existentes del profesor. Conserva filas previas, asignaciones, rutinas e historial. No añade almacenamiento de imágenes ni videos y no cambia las políticas de lectura entre cuentas.
