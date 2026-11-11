# Figuras anatómicas y Sexo opcional · V1.9.17

## Uso

El registro de alumno y la pantalla de completar cuenta incluyen Sexo (opcional), con los símbolos de Mujer y Hombre. La selección usa un fondo rosa suave o celeste suave, respectivamente. Se puede omitir. Los alumnos existentes pueden editarla desde Mi perfil > Editar mis datos; Quitar selección vuelve a la silueta neutra.

Solo cambia la figura anatómica de frente y espalda. No cambia los músculos seleccionados por el profesor, las rutinas, las cargas, el descanso ni el historial. Se conserva la figura neutra cuando no se elige una opción. No se deduce el sexo a partir del nombre ni de otro dato.

## Cuenta y persistencia

En las cuentas reales se guarda como `sex: female | male | ''` en los metadatos propios de Supabase Auth. Se recupera de la cuenta autenticada al entrar y puede modificarse desde el perfil. No requiere nuevos campos ni SQL. No se incorpora a las fichas públicas de alumnos ni a las consultas de profesores o administradores; en esta app solo se usa en la vista propia del alumno. Nunca concede roles o permisos.

En demo se guarda en la ficha local del alumno de prueba. Las demos no escriben en Supabase. Una cuenta real no guarda esta selección en el almacenamiento local de las demos.

## Ilustraciones

Las figuras masculina y femenina se adaptaron de los datos SVG de `react-native-body-highlighter` 3.2.0, bajo licencia MIT, Copyright (c) 2022 ELABBASSI Hicham. Fuente: https://github.com/HichamELBSI/react-native-body-highlighter

Se incluye el aviso completo en BODY-HIGHLIGHTER-LICENSE.txt. Se reutilizan solamente los trazados SVG, adaptados al navegador y a los grupos musculares de Entrenar; no se ejecuta React Native ni se añade ese paquete como dependencia de la app. Se incorporó la silueta exterior y se adaptaron las regiones de pantorrilla de la espalda femenina a sus proporciones. Los símbolos de selección y la silueta neutra son originales de Entrenar. No se utilizan imágenes de MuscleWiki.

Todos los trazados quedan integrados dentro de app.js para no depender de carpetas adicionales, servicios externos ni descargas al abrir el panel. No utiliza Supabase Storage.

## Actualización

Si ya se aplicó SQL 07 en V1.9.16, no hay otro SQL que ejecutar. Subir el contenido actualizado del ZIP a GitHub. La carpeta setup conserva SQL 07 para instalaciones anteriores.
