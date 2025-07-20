let modData = {
    plants: null,
    zombies: null,
    gameplay: null,
    minigames: null
};

let fileData = null;
let modifiedFileData = null;

const DOM = {
    fileInput: document.getElementById('file-input'),
    fileInfo: document.getElementById('file-info'),
    applyBtn: document.getElementById('apply-btn'),
    resetBtn: document.getElementById('reset-btn'),
    downloadBtn: document.getElementById('download-btn'),
    toggleAllPlants: document.getElementById('toggle-all-plants'),
    tabButtons: document.querySelectorAll('.tab-button'),
    tabContents: document.querySelectorAll('.tab-content'),
    youtubeLink: document.getElementById('youtube-link')
};

async function initializeApp() {
    await loadModData();
    setupUI();
    setupEventListeners();
}

async function loadModData() {
    try {
        const [plants, zombies, gameplay, minigames] = await Promise.all([
            fetchData('data/plants.json'),
            fetchData('data/zombies.json'),
            fetchData('data/gameplay.json'),
            fetchData('data/minigames.json')
        ]);

        modData = { plants, zombies, gameplay, minigames };
    } catch (error) {
        console.error('Error loading mod data:', error);
        showError('Error al cargar los datos de modificación. Por favor, recarga la página.');
    }
}

async function fetchData(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to load ${url}`);
    return await response.json();
}

function setupUI() {
    if (!modData.plants) return;

    generateTabContent('plants', modData.plants, [
        { title: 'Costos y Recargas', key: 'costs' },
        { title: 'Ratios de Acción', key: 'actionRates' },
        { title: 'Daños', key: 'damages' }
    ]);

    generateTabContent('zombies', modData.zombies, [
        { title: 'Tiers y Weights', key: 'tiers' },
        { title: 'Zomboss', key: 'zomboss' }
    ]);

    generateTabContent('gameplay', modData.gameplay, [
        { title: 'Animaciones', key: 'animations' }
    ]);

    generateMinigamesTab();
}

function generateTabContent(tabId, data, sections) {
    const container = document.getElementById(tabId);
    if (!container) return;

    container.innerHTML = '';
    const modSections = document.createElement('div');
    modSections.className = 'mod-sections';

    sections.forEach(section => {
        if (!data[section.key] || data[section.key].length === 0) return;

        const sectionElement = createModSection(section.title);
        data[section.key].forEach(item => {
            sectionElement.appendChild(createModOption(item));
        });
        modSections.appendChild(sectionElement);
    });

    container.appendChild(modSections);
}

function generateMinigamesTab() {
    const container = document.getElementById('minigames');
    if (!container || !modData.minigames) return;

    container.innerHTML = '';
    const modSections = document.createElement('div');
    modSections.className = 'mod-sections';

    const section = createModSection('Minijuegos');
    
    
    section.appendChild(createSectionTitle('Seeing Stars'));
    modData.minigames.seeingStars.forEach(item => {
        section.appendChild(createMinigameOption(item));
    });

    
    section.appendChild(createSectionTitle('Wall-nut Bowling'));
    modData.minigames.wallNutBowling.forEach(item => {
        section.appendChild(createMinigameOption(item));
    });

    
    section.appendChild(createSectionTitle('Girasoles'));
    modData.minigames.sunflower.forEach(item => {
        section.appendChild(createMinigameOption(item));
    });

    modSections.appendChild(section);
    container.appendChild(modSections);
}

function createModSection(title) {
    const section = document.createElement('div');
    section.className = 'mod-section';

    const heading = document.createElement('h2');
    heading.textContent = title;
    section.appendChild(heading);

    return section;
}

function createModOption(item) {
    const div = document.createElement('div');
    div.className = 'mod-option';
    
    const label = document.createElement('label');
    label.textContent = item.name;
    label.title = item.description;
    
    const input = document.createElement('input');
    input.type = 'number';
    input.dataset.offset = item.offset;
    input.value = item.defaultValue;
    input.min = 0;
    
    const original = document.createElement('span');
    original.className = 'original-value';
    original.textContent = `(${item.defaultValue})`;
    
    div.appendChild(label);
    div.appendChild(input);
    div.appendChild(original);
    
    return div;
}

function createMinigameOption(item) {
    const div = document.createElement('div');
    div.className = 'mod-option';
    
    const label = document.createElement('label');
    label.textContent = item.name;
    label.title = item.description;
    
    const input = document.createElement('input');
    input.type = 'number';
    input.dataset.offset = item.offset;
    input.value = item.defaultValue === -1 ? '' : item.defaultValue;
    input.min = -1;
    input.placeholder = "ID de planta";
    
    const original = document.createElement('span');
    original.className = 'original-value';
    original.textContent = item.defaultValue === -1 ? '(vacío)' : `(${item.defaultValue})`;
    
    div.appendChild(label);
    div.appendChild(input);
    div.appendChild(original);
    
    return div;
}

function createSectionTitle(title) {
    const h3 = document.createElement('h3');
    h3.textContent = title;
    return h3;
}

function setupEventListeners() {
   
    DOM.fileInput.addEventListener('change', handleFileSelect);
    
    
    DOM.applyBtn.addEventListener('click', applyChanges);
    DOM.resetBtn.addEventListener('click', resetValues);
    DOM.downloadBtn.addEventListener('click', downloadModifiedFile);
    
    
    DOM.tabButtons.forEach(button => {
        button.addEventListener('click', switchTab);
    });
    
    
    DOM.youtubeLink.addEventListener('click', function(e) {
        e.preventDefault();
        window.open(this.href, '_blank');
    });
    
    
    if (DOM.toggleAllPlants) {
        DOM.toggleAllPlants.addEventListener('change', toggleAllPlantsValues);
    }
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    DOM.fileInfo.textContent = `Archivo seleccionado: ${file.name}`;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        fileData = new Uint8Array(e.target.result);
        modifiedFileData = new Uint8Array(fileData);
        DOM.downloadBtn.style.display = 'inline-block';
    };
    reader.readAsArrayBuffer(file);
}

function applyChanges() {
    if (!fileData) {
        showError('Por favor, selecciona un archivo libpvz.so primero');
        return;
    }

    const inputs = document.querySelectorAll('input[data-offset]');
    let changesApplied = 0;
    
    inputs.forEach(input => {
        const offset = input.dataset.offset;
        const value = parseInt(input.value);
        
        if (!isNaN(value)) {
            const decimalOffset = parseInt(offset, 16);
            
            modifiedFileData[decimalOffset] = value & 0xFF;
            modifiedFileData[decimalOffset + 1] = (value >> 8) & 0xFF;
            modifiedFileData[decimalOffset + 2] = (value >> 16) & 0xFF;
            modifiedFileData[decimalOffset + 3] = (value >> 24) & 0xFF;
            
            changesApplied++;
        }
    });

    if (changesApplied > 0) {
        showSuccess(`${changesApplied} cambios aplicados correctamente. Ahora puedes descargar el archivo modificado.`);
    } else {
        showWarning('No se aplicaron cambios. Asegúrate de haber modificado algún valor.');
    }
}

function resetValues() {
    if (!fileData) {
        showError('Por favor, selecciona un archivo libpvz.so primero');
        return;
    }

    const inputs = document.querySelectorAll('input[data-offset]');
    let resetsApplied = 0;
    
    inputs.forEach(input => {
        const offset = input.dataset.offset;
        let defaultValue = findDefaultValue(offset);
        
        if (defaultValue !== undefined) {
            input.value = defaultValue === -1 ? '' : defaultValue;
            resetsApplied++;
        }
    });

    modifiedFileData = new Uint8Array(fileData);
    
    if (resetsApplied > 0) {
        showSuccess(`${resetsApplied} valores restablecidos a los predeterminados.`);
    }
}

function findDefaultValue(offset) {
    for (const category in modData) {
        for (const section in modData[category]) {
            if (Array.isArray(modData[category][section])) {
                const item = modData[category][section].find(i => i.offset === offset);
                if (item) return item.defaultValue;
            }
        }
    }
    return undefined;
}

function downloadModifiedFile() {
    if (!modifiedFileData) {
        showError('No hay datos modificados para descargar');
        return;
    }

    const blob = new Blob([modifiedFileData], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'libpvz_mod.so';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function switchTab() {
    const tabId = this.dataset.tab;
    
    
    DOM.tabButtons.forEach(btn => btn.classList.remove('active'));
    this.classList.add('active');
    
   
    DOM.tabContents.forEach(content => content.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
}

function toggleAllPlantsValues() {
    const inputs = document.querySelectorAll('#plant-costs-container input[type="number"]');
    inputs.forEach(input => {
        if (DOM.toggleAllPlants.checked) {
            input.value = 0;
        } else {
            const offset = input.dataset.offset;
            const defaultValue = findDefaultValue(offset);
            if (defaultValue !== undefined) {
                input.value = defaultValue;
            }
        }
    });
}

function showError(message) {
    alert(`Error: ${message}`);
    console.error(message);
}

function showWarning(message) {
    alert(`Advertencia: ${message}`);
    console.warn(message);
}

function showSuccess(message) {
    alert(`Éxito: ${message}`);
    console.log(message);
}

document.addEventListener('DOMContentLoaded', initializeApp);
