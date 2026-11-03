import fs from 'node:fs';
const file='/tmp/to-coloring-app/src/App.jsx';
let s=fs.readFileSync(file,'utf8');
const swaps=[
['Digital Coloring Book','Мастерская «Рыбка»'],
['Select a coloring page and start painting!','Выбери картинку, возьми кисточку и раскрась её!'],
['CHOOSE COLORING PAGE:','Выбери раскраску'],
['Clear Coloring','Очистить краски'],
['Reload Line Art','Восстановить контуры'],
['Loading image list from static file...','Загружаем раскраски…'],
['No Images Available','Раскраски пока не найдены'],
['Please select an image from the dropdown above, or ensure files are uploaded to','Выбери картинку выше. Каталог:'],
['Coloring Tools','Инструменты рисования'],
['Hardness (','Мягкость кисти ('],
['Brush Size (','Размер кисти ('],
['Select Brush Tool','Кисть и настройки'],
['Select Pan Tool','Перемещение холста'],
['Undo Last Stroke','Отменить действие'],
['Download Artwork','Скачать рисунок PNG'],
['Color</label>','Цвет</label>'],
['Error: Could not load or find images in','Не удалось загрузить раскраски из'],
['Coloring_Artwork_','Рисунок_Рыбка_'],
['Select coloring page:','Выбрать раскраску:'],
];
for(const [a,b] of swaps)s=s.split(a).join(b);
s=s.replace("const displayLabel = name.replace(/_/g, ' ').replace(/\\.\\w+$/, '');","const displayLabel = ({'fish.svg':'Рыбка','flower.svg':'Цветок','butterfly.svg':'Бабочка','undersea.svg':'Подводный мир'})[name] || name.replace(/_/g, ' ').replace(/\\.\\w+$/, '');");
s=s.replace('className="thumbnail-item ${selectedImage === name ? \'selected\' : \'\'}"','className="thumbnail-item ${selectedImage === name ? \'selected\' : \'\'}"');
s=s.replace('role="button"\n                            tabIndex="0"','role="button"\n                            tabIndex={0}\n                            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedImage(name); } }}');
s=s.replace('step="25" // 💡 CRITICAL: Enforce snapping to multiples of 25','step="25"');
s=s.replace('list="hardness-ticks" // 💡 CRITICAL: Link to the datalist','list="hardness-ticks"');
s=s.replace('<div className="mainwrapper">','<div className="mainwrapper"><div className="rybka-intro"><span>✦ ТВОРЧЕСКАЯ МАСТЕРСКАЯ</span><p>1. Выбери картинку · 2. Выбери цвет · 3. Рисуй пальцем или мышью</p></div>');
s=s.replace('</style>','</style>\n<link rel="stylesheet" href="/TO_startup/engines/art/rybka.css" />');
fs.writeFileSync(file,s);
console.log('Adapted upstream coloring interface');
