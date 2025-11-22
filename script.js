// Gestor de Tareas - script.js
const STORAGE_KEY = 'gestor.tareas.v1';
const THEME_KEY = 'gestor.theme.v1';

const taskForm = document.getElementById('taskForm');
const taskInput = document.getElementById('taskInput');
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
		addTask(text);
		taskInput.value = '';
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
			toggleComplete(id, e.target.checked, li);
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

function addTask(text){
	const task = { id: String(Date.now()), text, completed:false, created: Date.now() };
	tasks.unshift(task);
	saveTasks();
	renderTasks(()=>{
		const el = document.querySelector('li[data-id="'+task.id+'"]');
		if(el) el.classList.add('task-enter');
	});
}

function startEditTask(id, li){
	const span = li.querySelector('.task-text');
	const old = span.textContent;
	const input = document.createElement('input');
	input.type = 'text'; input.value = old; input.className = 'edit-input';
	input.style.width = '100%';
	span.replaceWith(input);
	input.focus();

	function done(save){
		const newText = input.value.trim();
		if(save && newText){
			const t = tasks.find(t=>t.id===id);
			if(t){ t.text = newText; saveTasks(); }
		}
		renderTasks();
	}

	input.addEventListener('blur', () => done(true));
	input.addEventListener('keydown', (e)=>{
		if(e.key === 'Enter'){ input.blur(); }
		if(e.key === 'Escape'){ done(false); }
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

function toggleComplete(id, checked, li){
	const t = tasks.find(t=>t.id===id);
	if(!t) return;
	t.completed = !!checked;
	saveTasks();
	renderTasks();
}

function renderTasks(cb){
	// filtrado
	const filtered = tasks.filter(t => {
		if(filter === 'all') return true;
		if(filter === 'pending') return !t.completed;
		if(filter === 'completed') return t.completed;
	});

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
			li.innerHTML = `
				<div class="left">
					<input type="checkbox" ${t.completed ? 'checked' : ''} aria-label="Marcar tarea" />
					<span class="task-text ${t.completed ? 'completed' : ''}">${escapeHtml(t.text)}</span>
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

function escapeHtml(s){
	return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
