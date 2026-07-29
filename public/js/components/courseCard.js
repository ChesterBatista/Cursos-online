// ============================================
// COURSECARD.JS - Card de curso do catálogo
// ============================================

// Recebe um curso e o nome da sua categoria e retorna o HTML do card
export function criarCourseCard(curso, categoriaNome) {
  const iniciais = curso.titulo.slice(0, 2).toUpperCase();

  return `
    <article class="card course-card" data-id="${curso.id}">
      <div class="course-card__thumb" aria-hidden="true">${iniciais}</div>

      <div class="course-card__body">
        <span class="course-card__category">${categoriaNome || 'Categoria'}</span>
        <h3 class="course-card__title">${curso.titulo}</h3>
        <p class="course-card__description">${curso.descricao}</p>

        <div class="course-card__meta">
          <span>${curso.cargaHoraria}h de curso</span>
        </div>
      </div>

      <div class="course-card__footer">
        <a href="curso.html?id=${curso.id}" class="btn btn-secondary btn-block btn-sm">
          Ver detalhes
        </a>
      </div>
    </article>
  `;
}
