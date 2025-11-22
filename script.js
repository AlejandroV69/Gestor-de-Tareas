// Gestor de Tareas - script.js
const STORAGE_KEY = 'gestor.tareas.v1';
const THEME_KEY = 'gestor.theme.v1';

const taskForm = document.getElementById('taskForm');
const taskInput = document.getElementById('taskInput');
const taskPriority = null; // prioridad eliminada — mantenemos referencia nula por compatibilidad
const taskDue = document.getElementById('taskDue');
const taskList = document.getElementById('taskList');
const filterButtons = document.querySelectorAll('.filter-btn');
const themeToggle = document.getElementById('themeToggle');

let tasks = [];
let filter = 'all';

document.addEventListener('DOMContentLoaded', () => {
	loadTheme();
	loadTasks();
	bindEvents();
});

function bindEvents(){
	taskForm.addEventListener('submit', e => {
		e.preventDefault();
		const text = taskInput.value.trim();
		if(!text) return;
		const due = taskDue.value || null; // ISO date string or null
		addTask(text, due);
		taskInput.value = '';
		taskDue.value = '';
		taskInput.focus();
	});

	filterButtons.forEach(btn => {
		btn.addEventListener('click', () => {
			filterButtons.forEach(b=>b.classList.remove('active'));
			btn.classList.add('active');
			filter = btn.dataset.filter;
			renderTasks();
		});
	});

	themeToggle.addEventListener('click', () => {
		document.body.classList.toggle('dark');
		const isDark = document.body.classList.contains('dark');
		localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
	});

	// Delegación para acciones de la lista
	taskList.addEventListener('click', (e) => {
		const li = e.target.closest('li');
		if(!li) return;
		const id = li.dataset.id;
		if(e.target.matches('.action-delete')){
			removeTask(id, li);
		} else if(e.target.matches('.action-edit')){
			startEditTask(id, li);
		} else if(e.target.matches('input[type="checkbox"]')){
			toggleComplete(id, e.target.checked);
		}
	});
}

function loadTheme(){
	const saved = localStorage.getItem(THEME_KEY);
	if(saved === 'dark') document.body.classList.add('dark');
}

function loadTasks(){
	try{
		const raw = localStorage.getItem(STORAGE_KEY);
		tasks = raw ? JSON.parse(raw) : [];
	}catch(e){ tasks = []; }
	renderTasks();
}

function saveTasks(){
	localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function addTask(text, due = null){
	const task = { id: String(Date.now()), text, completed:false, created: Date.now(), due };
	tasks.unshift(task);
	saveTasks();
	renderTasks(()=>{
		const el = document.querySelector('li[data-id="'+task.id+'"]');
		if(el) el.classList.add('task-enter');
	});
}

function startEditTask(id, li){
	const t = tasks.find(x=>x.id===id);
	if(!t) return;
	// Crear formulario inline (solo texto y fecha)
	const form = document.createElement('form');
	form.className = 'inline-edit';
	form.innerHTML = `
		<input type="text" name="text" value="${escapeHtml(t.text)}" required />
		<input type="date" name="due" value="${t.due ? t.due : ''}" />
		<button type="submit" class="btn">Guardar</button>
		<button type="button" class="btn cancel">Cancelar</button>
	`;
	// Reemplazar contenido del li.left
	const left = li.querySelector('.left');
	left.style.display = 'block';
	left.innerHTML = '';
	left.appendChild(form);

	const input = form.querySelector('input[name="text"]');
	input.focus();

	form.addEventListener('submit', (e)=>{
		e.preventDefault();
		const newText = form.querySelector('input[name="text"]').value.trim();
		const newDue = form.querySelector('input[name="due"]').value || null;
		if(newText){
			t.text = newText;
			t.due = newDue;
			saveTasks();
			renderTasks();
		}
	});

	form.querySelector('.cancel').addEventListener('click', ()=>{
		renderTasks();
	});
}

function removeTask(id, li){
	// animación de salida
	li.classList.add('task-exit');
	li.addEventListener('animationend', () => {
		tasks = tasks.filter(t=>t.id !== id);
		saveTasks();
		renderTasks();
	}, { once:true });
}

function toggleComplete(id, checked){
	const t = tasks.find(t=>t.id===id);
	if(!t) return;
	t.completed = !!checked;
	saveTasks();
	renderTasks();
}

function sortTasks(arr){
	return arr.slice().sort((a,b) => {
		// Primero por fecha: tareas con fecha aparecen antes (las más próximas primero). Sin fecha -> al final
		if(a.due && b.due){
			if(a.due < b.due) return -1;
			if(a.due > b.due) return 1;
		} else if(a.due && !b.due){
			return -1;
		} else if(!a.due && b.due){
			return 1;
		}
		// Finalmente por creación (más reciente arriba)
		return b.created - a.created;
	});
}

function renderTasks(cb){
	// filtrado
	let filtered = tasks.filter(t => {
		if(filter === 'all') return true;
		if(filter === 'pending') return !t.completed;
		if(filter === 'completed') return t.completed;
	});

	// ordenar
	filtered = sortTasks(filtered);

	// construir HTML
	taskList.innerHTML = '';
	if(filtered.length === 0){
		const empty = document.createElement('li');
		empty.className = 'task-item';
		empty.innerHTML = '<div class="left"><span class="task-text" style="color:var(--muted)">No hay tareas</span></div>';
		taskList.appendChild(empty);
	} else {
		filtered.forEach(t => {
			const li = document.createElement('li');
			li.className = 'task-item';
			li.dataset.id = t.id;
			const dueLabel = t.due ? formatDate(t.due) : '';
			li.innerHTML = `
				<div class="left">
					<input type="checkbox" ${t.completed ? 'checked' : ''} aria-label="Marcar tarea" />
					<span class="task-text ${t.completed ? 'completed' : ''}">${escapeHtml(t.text)}</span>
					${ dueLabel ? `<span class="due">${dueLabel}</span>` : '' }
				</div>
				<div class="actions">
					<button class="action-btn action-edit" title="Editar" aria-label="Editar tarea">✏️</button>
					<button class="action-btn action-delete" title="Eliminar" aria-label="Eliminar tarea">🗑️</button>
				</div>
			`;
			taskList.appendChild(li);
		});
	}
	if(typeof cb === 'function') cb();
}

function formatDate(iso){
	try{
		const d = new Date(iso);
		if(isNaN(d)) return iso;
		return d.toLocaleDateString();
	}catch(e){ return iso; }
}

function escapeHtml(s){
	return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
