import React from 'react';

export default function StepCategoria({ form, handleChange, styles, getProductCategories, getServiceCategories }) {
  return (
    <select
      name="category"
      value={form.category}
      onChange={handleChange}
      required
      className={styles.publicarSelect}
    >
      <option value="">Selecciona una categoría</option>
      {(form.type === 'producto' ? getProductCategories() : getServiceCategories())
        .map(groupObj => (
          <optgroup key={groupObj.group} label={groupObj.group}>
            {groupObj.options.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </optgroup>
        ))}
    </select>
  );
}
