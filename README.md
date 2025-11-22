# Gestor de Tareas

Pequeña aplicación de tareas hecha con HTML, CSS y JavaScript puro. Permite agregar, editar, eliminar y marcar tareas como completadas. Las tareas se guardan en `localStorage` y dispone de filtros (Todas, Pendientes, Completadas) y un modo oscuro.

Archivos principales:

- `index.html` — estructura y elementos de la UI.
- `style.css` — estilos, modo oscuro y animaciones.
- `script.js` — lógica: CRUD, filtros y persistencia.

Cómo ejecutar

1. Abrir `index.html` en el navegador (doble clic en Windows o `Start-Process` en PowerShell).

Git (subir a GitHub) — comandos ejemplo en PowerShell

```powershell
git init
git add .
git commit -m "Agregar Gestor de Tareas"
gh repo create tu-usuario/Gestor-de-Tareas --public --source=. --remote=origin
git push -u origin main
```

Si no usas la CLI `gh`, crea el repo en GitHub y sigue las instrucciones para conectar el remoto:

```powershell
git remote add origin https://github.com/tu-usuario/Gestor-de-Tareas.git
git push -u origin main
```

Mejoras sugeridas

- Añadir prioridad y fechas de vencimiento.
- Reordenar tareas con drag & drop.
- Sincronizar con backend (API) y autenticación.
- Añadir tests unitarios con Jest o similar.
