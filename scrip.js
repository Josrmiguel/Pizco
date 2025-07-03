let pedidos = JSON.parse(localStorage.getItem('pedidos')) || [];

function showSection(id) {
  document.querySelectorAll('section').forEach(s => s.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');

  document.querySelectorAll('header button').forEach(btn => btn.classList.remove('active'));
  const buttons = document.querySelectorAll('header button');
  buttons.forEach(btn => {
    if (btn.getAttribute('onclick')?.includes(id)) {
      btn.classList.add('active');
    }
  });

  if (id === 'historial') mostrarHistorial();
  if (id === 'reservas') {
    mostrarReservas();
    mostrarResumen();
  }
  if (id === 'pedido') mostrarResumen();
  if (id === 'resumen') mostrarResumen();
}

const cantidades = {
  bandeja: 0,
  canastillas: 0,
  canapes: 0,
  mediasnoches: 0,
  tartas: 0
};

function modificarCantidad(producto, cambio) {
  cantidades[producto] = Math.max(0, cantidades[producto] + cambio);
  document.getElementById(producto).textContent = cantidades[producto];
}

function confirmarPedido() {
  const encargo = document.getElementById('encargo').value.trim();
  const telefono = document.getElementById('telefono').value.trim();
  if (!encargo) {
    alert('Por favor, introduce un nombre o referencia para el encargo.');
    return;
  }

  const notas = document.getElementById('notas').value;
  const pago = document.querySelector('input[name="pago"]:checked').value;
  const tieneAlergia = document.querySelector('input[name="tieneAlergia"]:checked')?.value === 'si';
  const alergiasSeleccionadas = [];
  if (tieneAlergia) {
    document.querySelectorAll('input[name="alergias"]:checked').forEach(cb => alergiasSeleccionadas.push(cb.value));
  }

  const nuevo = {
    id: Date.now(),
    fecha: Date.now(),
    encargo: encargo,
    telefono: telefono,
    productos: { ...cantidades },
    notas,
    pago,
    alergias: alergiasSeleccionadas,
    estado: 'Activo'
  };

  pedidos.push(nuevo);
  localStorage.setItem('pedidos', JSON.stringify(pedidos));
  alert('Pedido confirmado');

  Object.keys(cantidades).forEach(p => {
    cantidades[p] = 0;
    document.getElementById(p).textContent = '0';
  });
  document.getElementById('encargo').value = '';
  document.getElementById('telefono').value = '';
  document.getElementById('notas').value = '';
  document.querySelector('input[name="pago"][value="Pendiente"]').checked = true;
  document.querySelector('input[name="tieneAlergia"][value="no"]').checked = true;
  document.getElementById('alergiasBox').style.display = 'none';
  document.querySelectorAll('input[name="alergias"]').forEach(cb => cb.checked = false);

  mostrarResumen();
  mostrarReservas();
}

function mostrarReservas() {
  const div = document.getElementById('listaReservas');
  div.innerHTML = '';
  const filtro = document.getElementById('busquedaReservas')?.value.toLowerCase() || '';

  pedidos.forEach(p => {
    if (
      p.estado === 'Activo' &&
      ((p.encargo && p.encargo.toLowerCase().includes(filtro)) ||
       (p.telefono && p.telefono.toLowerCase().includes(filtro)))
    ) {
      const productosEncargados = Object.entries(p.productos)
        .filter(([_, cantidad]) => cantidad > 0)
        .map(([nombre, cantidad]) => `${nombre.toUpperCase()}: ${cantidad}`)
        .join(', ');

      const el = document.createElement('div');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.style.marginRight = '10px';
      checkbox.onchange = () => {
        if (confirm('¿Seguro que quieres marcarlo como entregado?')) {
          marcarEntregado(p.id);
        } else {
          checkbox.checked = false;
        }
      };

      el.innerHTML = `<strong>${p.encargo}</strong> (${p.telefono || 'sin teléfono'}): ${productosEncargados} – <strong>${p.pago}</strong>`;

      if (p.alergias?.length) {
        const alergiasTxt = p.alergias.join(', ');
        el.innerHTML += `<br><em>Alergias:</em> <span style="color:red">${alergiasTxt}</span>`;
        el.classList.add('alergia');
      }

      if (p.notas) {
        el.innerHTML += `<br><em>Notas:</em> ${p.notas}`;
      }

      el.prepend(checkbox);
      div.appendChild(el);
    }
  });
}

function mostrarHistorial() {
  const div = document.getElementById('listaHistorial');
  div.innerHTML = '';
  const filtro = document.getElementById('busquedaHistorial')?.value.toLowerCase() || '';

  const pedidosFiltrados = pedidos.filter(p =>
    (p.encargo && p.encargo.toLowerCase().includes(filtro)) ||
    (p.telefono && p.telefono.toLowerCase().includes(filtro))
  );

  const grupos = {};

  pedidosFiltrados.forEach(p => {
    const date = new Date(p.fecha);
    const key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    if (!grupos[key]) grupos[key] = [];
    grupos[key].push(p);
  });

  const keys = Object.keys(grupos).sort((a, b) => {
    const [yearA, monthA] = a.split('-').map(Number);
    const [yearB, monthB] = b.split('-').map(Number);
    if (yearA !== yearB) return yearB - yearA;
    return monthB - monthA;
  });

  keys.forEach(key => {
    const [year, month] = key.split('-');
    const fechaTitulo = new Date(year, month - 1);
    const opciones = { year: 'numeric', month: 'long' };
    const tituloMes = fechaTitulo.toLocaleDateString('es-ES', opciones);

    const contenedorMes = document.createElement('div');
    contenedorMes.style.border = '1px solid #ccc';
    contenedorMes.style.padding = '10px';
    contenedorMes.style.marginBottom = '1em';
    contenedorMes.style.borderRadius = '8px';
    contenedorMes.style.backgroundColor = '#fafafa';

    const titulo = document.createElement('h3');
    titulo.textContent = tituloMes;

    const btnEliminarMes = document.createElement('button');
    btnEliminarMes.textContent = `Eliminar pedidos de ${tituloMes}`;
    btnEliminarMes.style.marginBottom = '10px';
    btnEliminarMes.style.cursor = 'pointer';
    btnEliminarMes.onclick = () => {
      if (confirm(`¿Seguro que quieres eliminar todos los pedidos de ${tituloMes}? Esta acción no se puede deshacer.`)) {
        eliminarPedidosMes(year, month);
      }
    };

    contenedorMes.appendChild(titulo);
    contenedorMes.appendChild(btnEliminarMes);

    grupos[key].forEach(p => {
      const productosEncargados = Object.entries(p.productos)
        .filter(([_, cantidad]) => cantidad > 0)
        .map(([nombre, cantidad]) => `${nombre.toUpperCase()} (${cantidad})`)
        .join(', ');

      const el = document.createElement('div');
      el.style.padding = '5px 0';
      el.style.borderBottom = '1px solid #ddd';
      el.style.display = 'flex';
      el.style.justifyContent = 'space-between';
      el.style.alignItems = 'center';

      const detalles = document.createElement('div');
      detalles.innerHTML = `<strong>${p.encargo}</strong> (${p.telefono || 'sin teléfono'}): ${productosEncargados}`;
      if (p.alergias?.length) {
        detalles.innerHTML += `<br><em>Alergias:</em> <span style="color:red">${p.alergias.join(', ')}</span>`;
      }
      if (p.notas) {
        detalles.innerHTML += `<br><em>Notas:</em> ${p.notas}`;
      }

      const botones = document.createElement('div');
      botones.classList.add('historial-botones');

      const volverBtn = document.createElement('button');
      volverBtn.textContent = '↩ Volver a reservas';
      volverBtn.style.marginRight = '8px';
      volverBtn.style.cursor = 'pointer';
      volverBtn.onclick = () => {
        p.estado = 'Activo';
        localStorage.setItem('pedidos', JSON.stringify(pedidos));
        mostrarHistorial();
        mostrarReservas();
        mostrarResumen();
      };

      const eliminarBtn = document.createElement('button');
      eliminarBtn.textContent = '🗑️ Eliminar';
      eliminarBtn.style.cursor = 'pointer';
      eliminarBtn.style.backgroundColor = '#ff6f6f';
      eliminarBtn.style.color = 'white';
      eliminarBtn.style.border = 'none';
      eliminarBtn.style.borderRadius = '5px';
      eliminarBtn.style.padding = '4px 8px';
      eliminarBtn.onclick = () => {
        if (confirm(`¿Quieres eliminar el pedido "${p.encargo}"? Esta acción no se puede deshacer.`)) {
          eliminarPedidoIndividual(p.id);
        }
      };

      botones.appendChild(volverBtn);
      botones.appendChild(eliminarBtn);

      el.appendChild(detalles);
      el.appendChild(botones);

      contenedorMes.appendChild(el);
    });

    div.appendChild(contenedorMes);
  });
}

function eliminarPedidosMes(year, month) {
  pedidos = pedidos.filter(p => {
    const date = new Date(p.fecha);
    return !(date.getFullYear() == year && (date.getMonth() + 1).toString().padStart(2, '0') == month.toString().padStart(2, '0'));
  });
  localStorage.setItem('pedidos', JSON.stringify(pedidos));
  mostrarHistorial();
  mostrarResumen();
  mostrarReservas();
}

function eliminarPedidoIndividual(id) {
  pedidos = pedidos.filter(p => p.id !== id);
  localStorage.setItem('pedidos', JSON.stringify(pedidos));
  mostrarHistorial();
  mostrarResumen();
  mostrarReservas();
}

function mostrarResumen() {
  const div = document.getElementById('resumenTotal');
  div.innerHTML = '';

  const totalProductos = {
    bandeja: 0,
    canastillas: 0,
    canapes: 0,
    mediasnoches: 0,
    tartas: 0
  };

  const alergiasPorTipo = {};

  pedidos.forEach(p => {
    if (p.estado === 'Activo') {
      Object.entries(p.productos).forEach(([producto, cantidad]) => {
        totalProductos[producto] += cantidad;

        p.alergias?.forEach(alergia => {
          if (!alergiasPorTipo[alergia]) alergiasPorTipo[alergia] = {};
          if (!alergiasPorTipo[alergia][producto]) alergiasPorTipo[alergia][producto] = 0;
          alergiasPorTipo[alergia][producto] += cantidad;
        });
      });
    }
  });

  const lista = document.createElement('ul');

  Object.entries(totalProductos).forEach(([producto, cantidad]) => {
    if (cantidad > 0) {
      const li = document.createElement('li');
      li.innerHTML = `<strong>${cantidad} ${producto.toUpperCase()}</strong>`;
      lista.appendChild(li);

      Object.entries(alergiasPorTipo).forEach(([alergia, productos]) => {
        if (productos[producto]) {
          const liA = document.createElement('li');
          liA.style.color = 'red';
          liA.style.marginLeft = '1em';
          liA.textContent = `${productos[producto]} de estas con alergia al ${alergia}`;
          lista.appendChild(liA);
        }
      });
    }
  });

  div.appendChild(lista);
}

function marcarEntregado(id) {
  const pedido = pedidos.find(p => p.id === id);
  if (pedido) pedido.estado = 'Entregado';
  localStorage.setItem('pedidos', JSON.stringify(pedidos));
  mostrarReservas();
  mostrarResumen();
}

function filtrarReservas() {
  mostrarReservas();
  mostrarResumen();
}

function filtrarHistorial() {
  mostrarHistorial();
}
