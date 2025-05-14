// categoryOptions.js - Opciones de categorías para productos y servicios
// Archivo centralizado para usar en toda la aplicación

export const categoryOptions = [
  // 🛍️ Categorías de Productos
  {
    group: 'Libros y apuntes',
    options: [
      { value: 'libros-texto', label: 'Libros de texto (nuevos y segunda mano)' },
      { value: 'apuntes-resumenes', label: 'Apuntes, resúmenes y esquemas' },
      { value: 'manuales-especializados', label: 'Manuales y guías especializadas' },
      { value: 'otros-libros', label: 'Otros (Libros y apuntes)' },
    ]
  },
  {
    group: 'Tecnología',
    options: [
      { value: 'ordenadores-dispositivos', label: 'Laptops, tablets y smartphones' },
      { value: 'accesorios-tec', label: 'Audífonos, cargadores y fundas' },
      { value: 'componentes-hardware', label: 'Memorias, SSD, tarjetas' },
      { value: 'software-licencias', label: 'Software con licencia estudiantil' },
      { value: 'otros-tec', label: 'Otros (Tecnología)' },
    ]
  },
  {
    group: 'Papelería y oficina',
    options: [
      { value: 'cuadernos-agendas', label: 'Cuadernos, agendas y planners' },
      { value: 'material-dibujo', label: 'Lápices, marcadores y rotuladores' },
      { value: 'impresion-encuadernacion', label: 'Impresiones y encuadernaciones' },
      { value: 'otros-papeleria', label: 'Otros (Papelería y oficina)' },
    ]
  },
  {
    group: 'Mobiliario y decoración',
    options: [
      { value: 'escritorios-sillas', label: 'Escritorios, sillas y muebles de estudio' },
      { value: 'lamparas-organizadores', label: 'Lámparas y organizadores de espacio' },
      { value: 'otros-mobiliario', label: 'Otros (Mobiliario y decoración)' },
    ]
  },
  {
    group: 'Moda y accesorios',
    options: [
      { value: 'ropa-casual', label: 'Prendas de vestir (casual, uniforme)' },
      { value: 'mochilas-bolsos', label: 'Mochilas, bolsos y estuches' },
      { value: 'otros-moda', label: 'Otros (Moda y accesorios)' },
    ]
  },
  {
    group: 'Arte y manualidades',
    options: [
      { value: 'pintura-dibujo', label: 'Pinturas, lienzos y pinceles' },
      { value: 'otros-arte', label: 'Otros (Arte y manualidades)' },
    ]
  },
  {
    group: 'Deporte y outdoor',
    options: [
      { value: 'equipamiento-deportivo', label: 'Pelotas, bandas y esterillas' },
      { value: 'ropa-calzado-deportivo', label: 'Ropa y calzado deportivo' },
      { value: 'otros-deporte', label: 'Otros (Deporte y outdoor)' },
    ]
  },
  {
    group: 'Alimentación y bebidas',
    options: [
      { value: 'snacks-preparados', label: 'Snacks y comidas caseras' },
      { value: 'bebidas-frias', label: 'Cafés, jugos y bebidas frías' },
      { value: 'otros-alimentacion', label: 'Otros (Alimentación y bebidas)' },
    ]
  },

  // 🛠️ Categorías de Servicios
  {
    group: 'Tutorías académicas',
    options: [
      { value: 'refuerzo-contenidos', label: 'Refuerzo y explicación de contenidos' },
      { value: 'resolucion-dudas', label: 'Resolución de dudas puntuales' },
      { value: 'ejercicios-practicos', label: 'Ayuda con ejercicios y prácticas' },
      { value: 'sesiones-grupo', label: 'Sesiones de estudio en grupo' },
      { value: 'mentoria-curso', label: 'Mentoría por asignatura' },
      { value: 'tecnicas-estudio', label: 'Técnicas de estudio y organización' },
      { value: 'presentaciones-proyectos', label: 'Asesoría en presentaciones y proyectos' },
      { value: 'otros-tutorias', label: 'Otros (Tutorías académicas)' },
    ]
  },
  {
    group: 'Diseño y multimedia',
    options: [
      { value: 'diseno-grafico', label: 'Diseño gráfico, branding y logos' },
      { value: 'edicion-video', label: 'Edición de foto y video' },
      { value: 'multimedia-creativa', label: 'Animaciones y presentaciones interactivas' },
      { value: 'otros-diseno', label: 'Otros (Diseño y multimedia)' },
    ]
  },
  {
    group: 'Traducción y redacción',
    options: [
      { value: 'traduccion-tecnica', label: 'Traducción académica y técnica' },
      { value: 'edicion-correccion', label: 'Corrección de estilo y ortografía' },
      { value: 'creacion-contenido', label: 'Redacción de blogs y artículos' },
      { value: 'otros-traduccion', label: 'Otros (Traducción y redacción)' },
    ]
  },
  {
    group: 'Desarrollo y tecnología',
    options: [
      { value: 'desarrollo-web-app', label: 'Desarrollo web y apps móviles' },
      { value: 'soporte-it', label: 'Soporte y reparación de equipos' },
      { value: 'configuracion-redes', label: 'Configuración de redes y servidores' },
      { value: 'otros-tecnologia', label: 'Otros (Desarrollo y tecnología)' },
    ]
  },
  {
    group: 'Asesoría y desarrollo profesional',
    options: [
      { value: 'cv-linkedin', label: 'Revisión de CV, LinkedIn y cartas de presentación' },
      { value: 'orientacion-carrera', label: 'Orientación vocacional y profesional' },
      { value: 'habilidades-blandas', label: 'Coaching en comunicación y liderazgo' },
      { value: 'otros-profesional', label: 'Otros (Asesoría y desarrollo profesional)' },
    ]
  },
  {
    group: 'Bienestar y estilo de vida',
    options: [
      { value: 'fitness-yoga', label: 'Clases de yoga, pilates y fitness' },
      { value: 'nutricion-dietas', label: 'Planes de nutrición y alimentación saludable' },
      { value: 'otros-bienestar', label: 'Otros (Bienestar y estilo de vida)' },
    ]
  },
  {
    group: 'Eventos y logística',
    options: [
      { value: 'organizacion-eventos', label: 'Organización de talleres, meetups y ferias' },
      { value: 'otros-eventos', label: 'Otros (Eventos y logística)' },
    ]
  },
];

// Helper functions to filter categories
export const getProductCategories = () => {
  return categoryOptions.filter(groupObj => [
    'Libros y apuntes',
    'Tecnología',
    'Papelería y oficina',
    'Mobiliario y decoración',
    'Moda y accesorios',
    'Arte y manualidades',
    'Deporte y outdoor',
    'Alimentación y bebidas',
  ].includes(groupObj.group));
};

export const getServiceCategories = () => {
  return categoryOptions.filter(groupObj => [
    'Tutorías académicas',
    'Diseño y multimedia',
    'Traducción y redacción',
    'Desarrollo y tecnología',
    'Asesoría y desarrollo profesional',
    'Bienestar y estilo de vida',
    'Eventos y logística',
  ].includes(groupObj.group));
};

// Helper function to get category label from value
export const getCategoryLabel = (value) => {
  for (const group of categoryOptions) {
    for (const option of group.options) {
      if (option.value === value) {
        return option.label;
      }
    }
  }
  return '';
};
