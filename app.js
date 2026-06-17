// =======================================
// DATOS
// =======================================

let viticultores = JSON.parse(localStorage.getItem("viticultores")) || [];
let entradas = JSON.parse(localStorage.getItem("entradas")) || [];

let lias =
JSON.parse(
localStorage.getItem("lias")
) || [];

let hollejos =
JSON.parse(
localStorage.getItem("hollejos")
) || [];

let datosDeposito =
JSON.parse(
localStorage.getItem("datosDeposito")
) || {};

let anioActivo =
Number(
    localStorage.getItem("anioActivo")
) || new Date().getFullYear();

let modalVitIndex = null;
let modalTitIndex = null;
let modalVinaIndex = null;
let viticultorEditando = null;


// =======================================
// NAVEGACIÓN
// =======================================

document.querySelectorAll(".nav-btn").forEach(btn => {

    btn.addEventListener("click", () => {

        document.querySelectorAll(".nav-btn")
            .forEach(b => b.classList.remove("active"));

        btn.classList.add("active");

        document.querySelectorAll(".page")
            .forEach(p => p.classList.remove("active"));

  if(
    btn.dataset.page ===
    "depositos"
){
    renderDepositos();
}

if(
    btn.dataset.page ===
    "totales"
){
    renderTotales();
}

        document
            .getElementById(`page-${btn.dataset.page}`)
            .classList.add("active");

    });

});

// =======================================
// EXPORTAR PDF
// =======================================

document
.getElementById("pdfBtn")
.addEventListener("click", exportarPDF);

function exportarPDF(){

    const { jsPDF } = window.jspdf;

    const pagina =
    document.querySelector(".page.active");

    // =====================================
// VITICULTORES
// =====================================

if (pagina.id === "page-viticultores") {

    if (viticultores.length === 0) {

        alert("No hay viticultores registrados");
        return;

    }

    const lista = viticultores
        .map((v, i) => `${i + 1} - ${v.nombre}`)
        .join("\n");

    const seleccion = prompt(
        `Seleccione el número del viticultor:\n\n${lista}`
    );

    if (seleccion === null) return;

    const indice = Number(seleccion) - 1;

    if (
        isNaN(indice) ||
        indice < 0 ||
        indice >= viticultores.length
    ) {

        alert("Selección no válida");
        return;

    }

    exportarViticultorPDF(indice);

    return;
}

function exportarViticultorPDF(indice) {

    const { jsPDF } = window.jspdf;

    const doc = new jsPDF("portrait");

    const vit = viticultores[indice];

    // =====================================
    // CABECERA
    // =====================================

    doc.setFontSize(18);

    doc.text(
        vit.nombre,
        14,
        18
    );

    doc.setFontSize(11);

    doc.text(
        `Observaciones / Teléfono: ${vit.detalle || "-"}`,
        14,
        26
    );

    doc.text(
        `Total hectáreas: ${Number(vit.totalHectareas || 0).toFixed(2)}`,
        14,
        33
    );

    let posicionY = 42;

    // =====================================
    // HISTORIAL DE CAMPAÑAS
    // =====================================

    const historialAutomatico = {};

    vit.titulares.forEach(titular => {

        entradas.forEach(e => {

            if (e.titular !== titular.nombre) return;

            const anio = Number(e.anio || 2025);

            if (!historialAutomatico[anio]) {

                historialAutomatico[anio] = 0;

            }

            historialAutomatico[anio] += Number(e.kgNeto || 0);

        });

    });

    const historial = [];

    (vit.historial || []).forEach(h => {

        historial.push([
            "Manual",
            h.anio,
            Number(h.kg || 0).toFixed(0)
        ]);

    });

    Object.entries(historialAutomatico).forEach(([anio, kg]) => {

        historial.push([
            "Automático",
            anio,
            Number(kg).toFixed(0)
        ]);

    });

    historial.sort((a, b) => Number(a[1]) - Number(b[1]));

    doc.setFontSize(14);

    doc.text(
        "Historial de Campañas",
        14,
        posicionY
    );

    doc.autoTable({

        startY: posicionY + 5,

        head: [[
            "Tipo",
            "Año",
            "Kg Uva"
        ]],

        body: historial,

        theme: "grid",

        headStyles: {
            fillColor: [210, 140, 135]
        },

        styles: {
            fontSize: 9
        }

    });

    posicionY = doc.lastAutoTable.finalY + 15;

    // =====================================
    // TITULARES Y VIÑAS
    // =====================================

    vit.titulares.forEach((titular, index) => {

        if (posicionY > 230) {

            doc.addPage();
            posicionY = 20;

        }

        doc.setFontSize(13);

        doc.text(
            `Titular: ${titular.nombre}`,
            14,
            posicionY
        );

        doc.setFontSize(10);

        doc.text(
            `DNI / CIF: ${titular.dni || "-"}`,
            14,
            posicionY + 7
        );

        posicionY += 14;

        const filasVinas = titular.vinas.map(vina => [

            vina.municipio || "",
            vina.poligono || "",
            vina.parcela || "",
            vina.recinto || "",
            vina.paraje || "",
            vina.variedad || "",
            Number(vina.hectareas || 0).toFixed(2),
            Number(vina.kgHa || 0).toFixed(0),
            Number(vina.rendimiento || 0).toFixed(0),
            vina.vendimia || "",
            vina.anio || ""

        ]);

        doc.autoTable({

            startY: posicionY,

            head: [[
                "Municipio",
                "Pol.",
                "Parc.",
                "Rec.",
                "Paraje",
                "Variedad",
                "Ha",
                "Kg/Ha",
                "Rto.",
                "Vendimia",
                "Año"
            ]],

            body: filasVinas,

            theme: "grid",

            headStyles: {
                fillColor: [210, 140, 135]
            },

            styles: {
                fontSize: 7
            }

        });

        posicionY = doc.lastAutoTable.finalY + 12;

    });

    doc.save(
        `Viticultor_${vit.nombre}.pdf`
    );

}

    // =====================================
    // ENTRADAS DE UVA
    // =====================================

    if(pagina.id === "page-entradas"){

        const doc =
        new jsPDF("landscape");

        doc.setFontSize(16);

        doc.text(
            `ENTRADAS DE UVA - CAMPAÑA ${anioActivo}`,
            14,
            15
        );

        const filas = [];

        entradas.forEach(e=>{

            if(
                Number(e.anio || 2025)
                !== anioActivo
            ) return;

            filas.push([

                e.fecha || "",
                e.hora || "",

                e.titular || "",
                e.vina || "",

                e.dni || "",

                e.municipio || "",
                e.poligono || "",
                e.parcela || "",
                e.recinto || "",

                e.variedad || "",
                e.vendimia || "",

                e.kgBruto || 0,
                e.kgTara || 0,
                e.kgNeto || 0,

                e.grado || 0,

                e.deposito || "",
                e.vuelta || ""

            ]);

        });

        doc.autoTable({

            startY:25,

            head:[[
                "Fecha",
                "Hora",
                "Titular",
                "Viña",
                "DNI",
                "Municipio",
                "Pol",
                "Parc",
                "Rec",
                "Variedad",
                "Vendimia",
                "Kg Bruto",
                "Kg Tara",
                "Kg Neto",
                "Grado",
                "Depósito",
                "Vuelta"
            ]],

            body:filas,

            theme:"grid",

            styles:{
                fontSize:6,
                cellPadding:1
            },

            headStyles:{
                fillColor:[210,140,135]
            }

        });

        doc.save(
            `Entradas_Uva_${anioActivo}.pdf`
        );

        return;
    }

    // =====================================
    // DEPÓSITOS ENCUBADOS
    // =====================================

    if(pagina.id === "page-depositos"){

        const doc =
        new jsPDF("portrait");

        doc.setFontSize(16);

        doc.text(
            `DEPÓSITOS ENCUBADOS - CAMPAÑA ${anioActivo}`,
            14,
            15
        );

        const filas = [];

        const grupos = {};

        entradas.forEach(e=>{

            if(
                Number(e.anio || 2025)
                !== anioActivo
            ) return;

            if(
                !e.deposito ||
                !e.vuelta ||
                !e.kgNeto
            ) return;

            const clave =
            `${e.deposito}-${e.vuelta}`;

            if(!grupos[clave]){

                grupos[clave]={

                    deposito:e.deposito,
                    vuelta:e.vuelta,
                    kg:0

                };

            }

            grupos[clave].kg +=
            Number(e.kgNeto);

        });

        const colores = [];

        Object.values(grupos)
        .forEach(grupo=>{

            const clave =
            `${grupo.deposito}-${grupo.vuelta}`;

            const datos =
            datosDeposito[clave] || {};

            const yemaPrev =
            grupo.kg * 0.60;

            const prensaPrev =
            grupo.kg * 0.15;

            const totalLitros =
            Number(datos.yemaReal || 0) +
            Number(datos.prensaReal || 0);

            const totalPH =
            totalLitros +
            Number(datos.ph || 0);

            const porcentaje =
            grupo.kg > 0
            ?
            (totalLitros / grupo.kg)*100
            :
            0;

            filas.push([

                grupo.deposito,
                grupo.vuelta,

                grupo.kg.toFixed(0),

                yemaPrev.toFixed(0),
                prensaPrev.toFixed(0),

                datos.yemaReal || 0,
                datos.prensaReal || 0,
                datos.ph || 0,

                totalLitros.toFixed(0),

                porcentaje.toFixed(2)+" %",

                totalPH.toFixed(0)

            ]);

            colores.push(
                datos.descubado === true
            );

        });

        doc.autoTable({

            startY:25,

            head:[[
                "Depósito",
                "Vuelta",
                "Kg Uva",
                "Yema Prev.",
                "Prensa Prev.",
                "Yema Real",
                "Prensa Real",
                "pH",
                "Litros",
                "% Rto.",
                "Total"
            ]],

            body:filas,

            theme:"grid",

            headStyles:{
                fillColor:[210,140,135]
            },

            didParseCell:function(data){

                if(
                    data.section === "body" &&
                    colores[data.row.index]
                ){

                    data.cell.styles.fillColor =
                    [152,209,180];

                }

            }

        });

        doc.save(
            `Depositos_${anioActivo}.pdf`
        );

        return;
    }

    // =====================================
    // TOTALES
    // =====================================

    if(pagina.id === "page-totales"){

        const doc =
        new jsPDF("portrait");

        const tablas = [

    {
        titulo:"RESUMEN DE UVAS",
        id:"tablaTotalesUva",
        manual:false
    },

    {
        titulo:"RESUMEN DE LITROS",
        id:"tablaTotalesLitros",
        manual:false
    },

    {
        titulo:"LÍAS DEL VINO",
        id:"liasTable",
        manual:true
    },

    {
        titulo:"HOLLEJOS PRENSADOS",
        id:"hollejosTable",
        manual:true
    }

];

        tablas.forEach((tabla,index)=>{

            if(index>0){

                doc.addPage();

            }

            doc.setFontSize(16);

            doc.text(
                `${tabla.titulo} - CAMPAÑA ${anioActivo}`,
                14,
                15
            );

           if(!tabla.manual){

    doc.autoTable({

        html:`#${tabla.id}`,

        startY:25,

        theme:"grid",

        headStyles:{
            fillColor:[210,140,135]
        },

        footStyles:{
            fillColor:[210,140,135]
        },

        styles:{
            fontSize:9
        }

    });

}else{

    const tablaDOM =
    document.getElementById(tabla.id);

    const cabecera = [];

    tablaDOM.querySelectorAll("thead th")
    .forEach(th=>{

        if(
            th.textContent.trim() !== "Acciones"
        ){

            cabecera.push(
                th.textContent.trim()
            );

        }

    });

    const filas = [];

    tablaDOM.querySelectorAll("tbody tr")
    .forEach(tr=>{

        const fila = [];

        tr.querySelectorAll("td")
        .forEach(td=>{

            if(td.querySelector("button")) return;

            const input =
            td.querySelector("input");

            if(input){

                fila.push(input.value);

            }else{

                fila.push(
                    td.textContent.trim()
                );

            }

        });

        filas.push(fila);

    });

    const pie = [];

    const filaPie = [];

    tablaDOM.querySelectorAll("tfoot th")
    .forEach(th=>{

        if(th.textContent.trim()){

            filaPie.push(
                th.textContent.trim()
            );

        }

    });

    if(filaPie.length){

        pie.push(filaPie);

    }

    doc.autoTable({

        startY:25,

        head:[cabecera],

        body:filas,

        foot:pie,

        theme:"grid",

        headStyles:{
            fillColor:[210,140,135]
        },

        footStyles:{
            fillColor:[210,140,135]
        },

        styles:{
            fontSize:9
        }

    });

}

        });

        doc.save(
            `Totales_${anioActivo}.pdf`
        );

    }

}



// =======================================
// TABLA VITICULTORES
// =======================================

const vitTableBody =
document.querySelector("#viticultoresTable tbody");

// =======================================
// NUEVO VITICULTOR
// =======================================

document
.getElementById("addViticultor")
.addEventListener("click", () => {

    const nombre =
    document.getElementById("vitNombre").value.trim();

    const detalle =
    document.getElementById("vitDetalle").value.trim();

    if (!nombre) {

        alert("Debe indicar el nombre");
        return;

    }

    viticultores.push({

        id: Date.now(),

        nombre,
        detalle,

        totalHectareas: 0,

        historial: [],

        titulares: []

    });

    document.getElementById("vitNombre").value = "";
    document.getElementById("vitDetalle").value = "";

    renderViticultores();
    guardarDatos();

});

// =======================================
// RENDER VITICULTORES
// =======================================

function renderViticultores() {

    vitTableBody.innerHTML = "";

    viticultores.forEach((vit, index) => {

        const historialAutomatico = {};

        vit.titulares.forEach(titular=>{

    entradas.forEach(e=>{

        if(
            e.titular !== titular.nombre
        ) return;

        const anio =
        Number(e.anio || 2025);

        if(!historialAutomatico[anio]){

            historialAutomatico[anio] = 0;

        }

        historialAutomatico[anio] +=
        Number(e.kgNeto || 0);

    });

});

const historialCombinado = [];

vit.historial.forEach((h,i)=>{

    historialCombinado.push({

    tipo:"M (Real)",

    indiceReal:i,

    anio:Number(h.anio),

    kg:Number(h.kg)

});

});

Object.entries(historialAutomatico)
.forEach(([anio,kg])=>{

    historialCombinado.push({

        tipo:"A",

        anio:Number(anio),

        kg:Number(kg)

    });

});

historialCombinado.sort(
(a,b)=>a.anio-b.anio
);

        // FILA PRINCIPAL

        const tr = document.createElement("tr");

        tr.classList.add("viticultor-row");

        tr.innerHTML = `
            <td>${vit.nombre}</td>
            <td>${vit.detalle}</td>
            <td>${vit.totalHectareas.toFixed(2)}</td>
            <td class="actions">

                <button
                    class="edit"
                    onclick="editarViticultor(${index})">
                    Editar
                </button>

                <button
                    onclick="toggleHistorial(${index})">
                    Historial
                </button>

                <button
                    class="danger"
                    onclick="eliminarViticultor(${index})">
                    Eliminar
                </button>

            </td>
        `;

        vitTableBody.appendChild(tr);

        // FILA HISTORIAL

        const histRow =
        document.createElement("tr");

        histRow.id = `historial-${index}`;

        histRow.style.display =
vit.abierto
? "table-row"
: "none";

        histRow.innerHTML = `
            <td colspan="4">

                <div class="historial-box">

                    <h4>
                        Historial de Campañas
                    </h4>

<button
class="primary"
onclick="agregarAnio(${index})">

+ Añadir Campaña

</button>

                    <table class="subtable">

<thead>

<tr>
    <th>Tipo</th>
    <th>Año Campaña</th>
    <th>Kgs Uva</th>
    <th>Acciones</th>
</tr>
</thead>

<tbody>

${
historialCombinado.map((h,i)=>`

<tr>

<td>
${h.tipo}
</td>

<td>

${
h.tipo === "M (Real)"
?
`
<input
type="number"
value="${h.anio}"

onchange="
actualizarAnio(
${index},
${h.indiceReal}
this.value
)
">
`
:
h.anio
}

</td>

<td>

${
h.tipo === "M (Real)"
?
`
<input
type="number"
value="${h.kg}"

onchange="
actualizarKg(
${index},
${h.indiceReal}
this.value
)
">
`
:
h.kg.toFixed(0)
}

</td>

<td>

${
h.tipo === "M (Real)"
?
`
<button
class="danger"
onclick="
eliminarAnio(
${index},
${h.indiceReal}
)
">
Eliminar
</button>
`
:
"Automático"
}

</td>

</tr>

`).join("")
}

</tbody>

</table>

                    <hr style="margin:15px 0">

<h4>Titulares de Viñedo</h4>

<button
class="primary"
onclick="agregarTitular(${index})">
+ Añadir Titular
</button>

<table class="subtable">

    <thead>
        <tr>
            <th>Titular</th>
            <th>DNI / CIF</th>
            <th>Acciones</th>
        </tr>
    </thead>

    <tbody>

        ${
            vit.titulares.map((tit,titIndex)=>`

            <tr class="titular-row">

                <td>${tit.nombre}</td>

                <td>${tit.dni}</td>

                <td class="actions">

    <button
    class="edit"
    onclick="
    editarTitular(
    ${index},
    ${titIndex}
    )">
    Editar
    </button>

    <button
    onclick="
    toggleVinas(
    ${index},
    ${titIndex}
    )">
    ${
    tit.mostrarVinas
    ? "Ocultar Viñas"
    : "Mostrar Viñas"
    }
    </button>

    <button
    class="danger"
    onclick="
    eliminarTitular(
    ${index},
    ${titIndex}
    )">
    Eliminar
    </button>

</td>

${
tit.mostrarVinas
?
`
            </tr>

            <tr>
    <td colspan="3">

        <button
        class="primary"
        onclick="
        agregarVina(
        ${index},
        ${titIndex}
        )">
        + Añadir Viña
        </button>

        <table class="subtable">

            <thead>

                <tr>

                    <th>Municipio</th>
                    <th>Polígono</th>
                    <th>Parcela</th>
                    <th>Recinto</th>
                    <th>Paraje</th>
                    <th>Variedad <br>Uva</th>
                    <th>Ha</th>
                    <th>Kg/Ha Máx</th>
                    <th>Rendimiento <br>Kgs Uva Máx</th>
                    <th>Vendimia</th>
                    <th>Años <br>Viñedo</th>
                    <th>Acciones</th>

                </tr>

            </thead>

            <tbody>

                ${
                    tit.vinas.map((vina,vinaIndex)=>`

                    <tr class="vina-row">

                        <td>${vina.municipio}</td>
                        <td>${vina.poligono}</td>
                        <td>${vina.parcela}</td>
                        <td>${vina.recinto}</td>
                        <td>${vina.paraje}</td>
                        <td>${vina.variedad}</td>
                        <td>${vina.hectareas}</td>
                        <td>${vina.kgHa}</td>
                        <td>${vina.rendimiento}</td>
                        <td>${vina.vendimia}</td>
                        <td>${vina.anio}</td>

                        <td class="actions">

                            <button
                            class="edit"
                            onclick="
                            editarVina(
                            ${index},
                            ${titIndex},
                            ${vinaIndex}
                            )">
                            Editar
                            </button>

                            <button
                            class="danger"
                            onclick="
                            eliminarVina(
                            ${index},
                            ${titIndex},
                            ${vinaIndex}
                            )">
                            Eliminar
                            </button>

                        </td>

                    </tr>

                    `).join('')
                }

            </tbody>

        </table>

</td>
</tr>

`
:
''
}
            `).join('')
        }

    </tbody>

</table>

                </div>

            </td>
        `;

        vitTableBody.appendChild(histRow);

    });

}

// =======================================
// HISTORIAL
// =======================================

window.toggleHistorial = function(index){

    viticultores[index].abierto =
    !viticultores[index].abierto;

    renderViticultores();
    guardarDatos();

};

window.toggleVinas =
function(vitIndex,titIndex){

    const titular =
    viticultores[vitIndex]
    .titulares[titIndex];

    titular.mostrarVinas =
    !titular.mostrarVinas;

    renderViticultores();
    guardarDatos();

};

// =======================================
// AÑADIR AÑO
// =======================================

let viticultorCampania = null;

window.agregarAnio = function(index){

    viticultorCampania = index;

    document.getElementById("campaniaAnio").value =
        anioActivo;

    document.getElementById("campaniaKg").value =
        0;

    document
        .getElementById("modalCampania")
        .classList.add("show");

};

function cerrarModalCampania(){

    document
        .getElementById("modalCampania")
        .classList.remove("show");

}

function guardarCampania(){

    const anio = Number(
        document.getElementById("campaniaAnio").value
    );

    const kg = Number(
        document.getElementById("campaniaKg").value
    );

    if(!anio) return;

    viticultores[viticultorCampania]
        .historial.push({

            anio,
            kg

        });

    renderViticultores();
    guardarDatos();

    cerrarModalCampania();

}

// =======================================
// ACTUALIZAR KG
// =======================================

window.actualizarAnio =
function(vitIndex,anioIndex,valor){

    viticultores[vitIndex]
    .historial[anioIndex]
    .anio = valor;

};

window.eliminarAnio =
function(vitIndex,anioIndex){

    if(
        !confirm(
        "Eliminar campaña?"
        )
    ) return;

    viticultores[vitIndex]
    .historial
    .splice(
        anioIndex,
        1
    );

    renderViticultores();
    guardarDatos();

};

// =======================================
// EDITAR
// =======================================

window.editarViticultor = function(index){

    const vit = viticultores[index];

    viticultorEditando = index;

    document.getElementById(
        "editVitNombre"
    ).value = vit.nombre || "";

    document.getElementById(
        "editVitDetalle"
    ).value = vit.detalle || "";

    document
        .getElementById("modalViticultor")
        .classList.add("show");

};

function cerrarModalViticultor(){

    document
        .getElementById("modalViticultor")
        .classList.remove("show");

}

function guardarViticultor(){

    const nombre =
    document.getElementById(
        "editVitNombre"
    ).value.trim();

    const detalle =
    document.getElementById(
        "editVitDetalle"
    ).value.trim();

    if(!nombre){

        alert("Debe indicar el nombre");

        return;
    }

    viticultores[viticultorEditando].nombre =
    nombre;

    viticultores[viticultorEditando].detalle =
    detalle;

    guardarDatos();
    renderViticultores();

    cerrarModalViticultor();

}

// =======================================
// ELIMINAR
// =======================================

window.eliminarViticultor =
function(index){

    const ok =
    confirm(
    "Se eliminará el viticultor y toda su información."
    );

    if(!ok) return;

    viticultores.splice(index,1);

    renderViticultores();
    guardarDatos();

};

// =======================================
// INICIO
// =======================================

renderViticultores();

window.agregarTitular = function(vitIndex){

    modalVitIndex = vitIndex;
    modalTitIndex = null;

    document.getElementById(
        "tituloModalTitular"
    ).textContent = "NUEVO TITULAR";

    document.getElementById(
        "modalTitularNombre"
    ).value = "";

    document.getElementById(
        "modalTitularDni"
    ).value = "";

    document.getElementById(
        "modalTitular"
    ).classList.add("show");

};

window.editarTitular = function(vitIndex,titIndex){

    const titular =
    viticultores[vitIndex]
    .titulares[titIndex];

    modalVitIndex = vitIndex;
    modalTitIndex = titIndex;

    document.getElementById(
        "tituloModalTitular"
    ).textContent = "EDITAR TITULAR";

    document.getElementById(
        "modalTitularNombre"
    ).value = titular.nombre;

    document.getElementById(
        "modalTitularDni"
    ).value = titular.dni;

    document.getElementById(
        "modalTitular"
    ).classList.add("show");

};

window.eliminarTitular =
function(vitIndex,titIndex){

    if(
        !confirm(
            "Eliminar titular y toda su información?"
        )
    ) return;

    viticultores[vitIndex]
    .titulares
    .splice(
        titIndex,
        1
    );

    renderViticultores();
    guardarDatos();

};

window.agregarVina = function(vitIndex,titIndex){

    modalVitIndex = vitIndex;
    modalTitIndex = titIndex;
    modalVinaIndex = null;

    document.getElementById(
        "tituloModalVina"
    ).textContent = "NUEVA VIÑA";

    limpiarFormularioVina();

    document
    .getElementById("modalVina")
    .classList.add("show");

};

function recalcularHectareas(vitIndex){

    let total = 0;

    viticultores[vitIndex]
    .titulares
    .forEach(tit=>{

        tit.vinas.forEach(vina=>{

            total += Number(
                vina.hectareas || 0
            );

        });

    });

    viticultores[vitIndex]
    .totalHectareas = total;

}

window.editarVina =
function(vitIndex,titIndex,vinaIndex){

    const vina =
    viticultores[vitIndex]
    .titulares[titIndex]
    .vinas[vinaIndex];

    modalVitIndex = vitIndex;
    modalTitIndex = titIndex;
    modalVinaIndex = vinaIndex;

    document.getElementById(
        "tituloModalVina"
    ).textContent = "EDITAR VIÑA";

    document.getElementById("vinaMunicipio").value = vina.municipio || "";
    document.getElementById("vinaPoligono").value = vina.poligono || "";
    document.getElementById("vinaParcela").value = vina.parcela || "";
    document.getElementById("vinaRecinto").value = vina.recinto || "";
    document.getElementById("vinaParaje").value = vina.paraje || "";
    document.getElementById("vinaVariedad").value = vina.variedad || "";
    document.getElementById("vinaHectareas").value = vina.hectareas || "";
    document.getElementById("vinaKgHa").value = vina.kgHa || "";
    document.getElementById("vinaVendimia").value = vina.vendimia || "";
    document.getElementById("vinaAnio").value = vina.anio || "";

    document
    .getElementById("modalVina")
    .classList.add("show");

};

window.eliminarVina =
function(vitIndex,titIndex,vinaIndex){

    if(
        !confirm(
            "Eliminar viña?"
        )
    ) return;

    viticultores[vitIndex]
    .titulares[titIndex]
    .vinas
    .splice(
        vinaIndex,
        1
    );

    recalcularHectareas(vitIndex);

    renderViticultores();
    guardarDatos();
    renderEntradas();
    renderDepositos();

};

function cerrarModalTitular(){

    document
    .getElementById("modalTitular")
    .classList.remove("show");

}

function guardarTitular(){

    const nombre =
    document.getElementById(
        "modalTitularNombre"
    ).value.trim();

    const dni =
    document.getElementById(
        "modalTitularDni"
    ).value.trim();

    if(!nombre) return;

    if(modalTitIndex === null){

        viticultores[modalVitIndex]
        .titulares.push({

            nombre,
            dni,

            vinas:[],

            mostrarVinas:false

        });

    }else{

        const titular =
        viticultores[modalVitIndex]
        .titulares[modalTitIndex];

        titular.nombre = nombre;
        titular.dni = dni;

    }

    cerrarModalTitular();

    renderViticultores();
    guardarDatos();

}

function limpiarFormularioVina(){

    document.getElementById("vinaMunicipio").value = "";
    document.getElementById("vinaPoligono").value = "";
    document.getElementById("vinaParcela").value = "";
    document.getElementById("vinaRecinto").value = "";
    document.getElementById("vinaParaje").value = "";
    document.getElementById("vinaVariedad").value = "";
    document.getElementById("vinaHectareas").value = "";
    document.getElementById("vinaKgHa").value = "";
    document.getElementById("vinaVendimia").value = "";
    document.getElementById("vinaAnio").value = "";

}

function cerrarModalVina(){

    document
    .getElementById("modalVina")
    .classList.remove("show");

}

function guardarVina(){

    const hectareas =
    Number(
        document.getElementById(
            "vinaHectareas"
        ).value || 0
    );

    const kgHa =
    Number(
        document.getElementById(
            "vinaKgHa"
        ).value || 0
    );

    const datos = {

        municipio:
        document.getElementById(
            "vinaMunicipio"
        ).value,

        poligono:
        document.getElementById(
            "vinaPoligono"
        ).value,

        parcela:
        document.getElementById(
            "vinaParcela"
        ).value,

        recinto:
        document.getElementById(
            "vinaRecinto"
        ).value,

        paraje:
        document.getElementById(
            "vinaParaje"
        ).value,

        variedad:
        document.getElementById(
            "vinaVariedad"
        ).value,

        hectareas,

        kgHa,

        rendimiento:
        hectareas * kgHa,

        vendimia:
        document.getElementById(
            "vinaVendimia"
        ).value,

        anio:
        document.getElementById(
            "vinaAnio"
        ).value

    };

    if(modalVinaIndex === null){

        viticultores[modalVitIndex]
        .titulares[modalTitIndex]
        .vinas.push(datos);

    }else{

        viticultores[modalVitIndex]
        .titulares[modalTitIndex]
        .vinas[modalVinaIndex] = datos;

    }

    recalcularHectareas(modalVitIndex);

    cerrarModalVina();

    renderViticultores();
    guardarDatos();

}

// =======================================
// TABLA ENTRADAS
// =======================================

const entTableBody =
document.querySelector(
"#entradasTable tbody"
);

document
.getElementById("addEntrada")
.addEventListener("click",()=>{

    entradas.push({

        anio: anioActivo,

        fecha:"",
        hora:"",

        titular:"",
        vina:"",
        dni:"",

        municipio:"",
        poligono:"",
        parcela:"",
        recinto:"",

        variedad:"",
        vendimia:"",

        kgBruto:0,
        kgTara:0,
        kgNeto:0,

        grado:0,

        deposito:"",
        vuelta:""

    });

    renderEntradas();

});

function obtenerTitulares(){

    const lista = [];

    viticultores.forEach(v=>{

        v.titulares.forEach(t=>{

            lista.push({

                nombre:t.nombre,
                dni:t.dni,
                vinas:t.vinas

            });

        });

    });

    return lista;

}

function generarSelectTitulares(seleccionado=""){

    let html =
    `<option value="">Seleccione</option>`;

    obtenerTitulares()
    .forEach(t=>{

        html += `
        <option
        value="${t.nombre}"
        ${t.nombre===seleccionado?"selected":""}>
        ${t.nombre}
        </option>
        `;

    });

    return html;

}

function generarSelectVinas(
    titularNombre,
    seleccionada=""
){

    let html =
    `<option value="">Seleccione</option>`;

    const titular =
    obtenerTitulares()
    .find(
        t => t.nombre === titularNombre
    );

    if(!titular) return html;

    titular.vinas.forEach(v=>{

        const texto =
`${v.municipio} | Pol.${v.poligono} | Parc.${v.parcela} | Rec.${v.recinto}`;

        html += `

        <option
        value="${texto}"
        ${texto===seleccionada
            ? "selected"
            : ""}>

        ${texto}

        </option>

        `;

    });

    return html;

}

function renderEntradas(){

   entTableBody.innerHTML="";

entradas.forEach((e,index)=>{

    if(
        Number(e.anio || 2025)
        !== anioActivo
    ){
        return;
    }

    const tr =
    document.createElement("tr");

        tr.innerHTML = `

        <td>

<input
type="checkbox"
class="entrada-check"
data-index="${index}">

       </td>

        <td>

<input
type="date"
value="${e.fecha}"

onchange="
entradas[${index}].fecha=this.value;
guardarDatos();
">

</td>

        <td>

<input
type="time"
value="${e.hora}"

onchange="
entradas[${index}].hora=this.value;
guardarDatos();
">

</td>

        <td>

        <select
        onchange="
        seleccionarTitular(
        ${index},
        this.value
        )">

        ${generarSelectTitulares(
            e.titular
        )}

        </select>

        </td>

        <td>

<select
onchange="
seleccionarVina(
${index},
this.value
)">

${generarSelectVinas(
e.titular,
e.vina
)}

</select>

</td>

<td>
${e.dni||""}
</td>

        <td>
        ${e.municipio||""}
        </td>

        <td>
        ${e.poligono||""}
        </td>

        <td>
        ${e.parcela||""}
        </td>

        <td>
        ${e.recinto||""}
        </td>

        <td>
        ${e.variedad||""}
        </td>

        <td>
        ${e.vendimia||""}
        </td>

       <td>

<input
type="number"
value="${e.kgBruto}"

onchange="
actualizarKgBruto(
${index},
this.value
)
">

</td>

<td>

<input
type="number"
value="${e.kgTara}"

onchange="
actualizarKgTara(
${index},
this.value
)
">

</td>

<td>

${e.kgNeto}

</td>

<td>

<input
type="number"
step="0.1"

value="${e.grado}"

onchange="
entradas[${index}].grado =
Number(this.value)
">

</td>

<td>

<input
type="number"

value="${e.deposito}"

onchange="
entradas[${index}].deposito =
this.value
">

</td>

<td>

<input
type="number"

value="${e.vuelta}"

onchange="
entradas[${index}].vuelta =
this.value
">

</td>

        <button
        class="danger"
        onclick="
        eliminarEntrada(
        ${index}
        )">

        Eliminar

        </button>

        </td>
        `;

        entTableBody.appendChild(tr);

    });

}

window.seleccionarTitular =
function(index,nombre){

    const titular =
    obtenerTitulares()
    .find(
        t=>t.nombre===nombre
    );

    if(!titular) return;

    entradas[index].titular =
titular.nombre;

entradas[index].vina = "";

entradas[index].dni =
titular.dni;

entradas[index].municipio = "";
entradas[index].poligono = "";
entradas[index].parcela = "";
entradas[index].recinto = "";
entradas[index].variedad = "";
entradas[index].vendimia = "";

    renderEntradas();
    guardarDatos();

};

window.seleccionarVina =
function(index,texto){

    const titular =
    obtenerTitulares()
    .find(
        t =>
        t.nombre ===
        entradas[index].titular
    );

    if(!titular) return;

   const vina =
titular.vinas.find(v=>{

    return (
    `${v.municipio} | Pol.${v.poligono} | Parc.${v.parcela} | Rec.${v.recinto}`
    === texto
    );

});

    if(!vina) return;

    entradas[index].vina =
    texto;

    entradas[index].municipio =
    vina.municipio;

    entradas[index].poligono =
    vina.poligono;

    entradas[index].parcela =
    vina.parcela;

    entradas[index].recinto =
    vina.recinto;

    entradas[index].variedad =
    vina.variedad;

    entradas[index].vendimia =
    vina.vendimia;

    renderEntradas();

    guardarDatos();
};

window.eliminarEntrada =
function(index){

    entradas.splice(index,1);

    renderEntradas();
    renderDepositos();
    renderViticultores();

    renderTotalesLitros();
    renderLias();
    renderHollejos();

    guardarDatos();

};

window.actualizarKgBruto =
function(index,valor){

    entradas[index].kgBruto =
    Number(valor);

    entradas[index].kgNeto = Math.max(

        0,

        entradas[index].kgBruto -

        entradas[index].kgTara

    );

    renderEntradas();
    renderDepositos();
    guardarDatos();
    renderViticultores();
    renderLias();
    renderHollejos();

};

window.actualizarKgTara =
function(index,valor){

    entradas[index].kgTara =
    Number(valor);

    entradas[index].kgNeto = Math.max(

        0,

        entradas[index].kgBruto -

        entradas[index].kgTara

    );

    renderEntradas();
    renderDepositos();
    guardarDatos();
    renderViticultores();
    renderLias();
    renderHollejos();

};

function guardarDatos(){

    localStorage.setItem(
        "viticultores",
        JSON.stringify(viticultores)
    );

    localStorage.setItem(
        "entradas",
        JSON.stringify(entradas)
    );

    localStorage.setItem(
        "datosDeposito",
        JSON.stringify(datosDeposito)
    );

    localStorage.setItem(
        "lias",
        JSON.stringify(lias)
    );

    localStorage.setItem(
        "hollejos",
        JSON.stringify(hollejos)
    );

}

    // =======================================
// DEPÓSITOS
// =======================================

const depTableBody =
document.querySelector(
"#depositosTable tbody"
);



function renderDepositos(){

    depTableBody.innerHTML = "";

    const grupos = {};

    entradas.forEach(e=>{

    if(
        Number(e.anio || 2025)
        !== anioActivo
    ) return;

    if(
        !e.deposito ||
        !e.vuelta ||
        !e.kgNeto
    ) return;

       const clave =
`${anioActivo}-${e.deposito}-${e.vuelta}`;

        if(!grupos[clave]){

            grupos[clave] = {

                deposito:e.deposito,
                vuelta:e.vuelta,
                kg:0

            };

        }

        grupos[clave].kg +=
        Number(e.kgNeto);

    });

 

    Object.values(grupos)
    .forEach(grupo=>{

       const clave =
`${anioActivo}-${grupo.deposito}-${grupo.vuelta}`;

        if(!datosDeposito[clave]){

            datosDeposito[clave] = {

                yemaReal:0,
                prensaReal:0,
                ph:0,
                descubado:false

            };

        }

        const datos =
        datosDeposito[clave];

        const yemaPrev =
        grupo.kg * 0.60;

        const prensaPrev =
        grupo.kg * 0.15;

        const totalLitros =
        Number(datos.yemaReal) +
        Number(datos.prensaReal);

      const totalLitrosPH =
totalLitros +
Number(datos.ph || 0);

        const porcentaje =
        grupo.kg > 0
        ?
        (
            totalLitros /
            grupo.kg
        ) * 100
        :
        0;

        const claseFila =
datos.descubado
? "deposito-descubado"
: "";

       const tr =
document.createElement("tr");

tr.className = claseFila;

        tr.innerHTML = `

        <td>

<input
type="checkbox"
class="chkDeposito"
data-clave="${clave}">

</td>

        <td>${grupo.deposito}</td>

        <td>${grupo.vuelta}</td>

        <td>${grupo.kg.toFixed(0)}</td>

        <td>${yemaPrev.toFixed(0)}</td>

        <td>${prensaPrev.toFixed(0)}</td>

        <td>

            <input
            type="number"

            value="${datos.yemaReal}"

            onchange="
            actualizarYemaReal(
            '${clave}',
            this.value
            )">

        </td>

        <td>

            <input
            type="number"

            value="${datos.prensaReal}"

            onchange="
            actualizarPrensaReal(
            '${clave}',
            this.value
            )">

        </td>

        <td>

            <input
            type="number"
            step="0.01"

            value="${datos.ph}"

            onchange="
            actualizarPH(
            '${clave}',
            this.value
            )">

        </td>

        <td>

        ${totalLitros.toFixed(0)}

        </td>

        <td>

        ${porcentaje.toFixed(2)} %

        <td>
        ${totalLitrosPH.toFixed(0)}
        </td>

        </td>

        `;

        depTableBody.appendChild(tr);

    });

}

window.actualizarYemaReal =
function(clave,valor){

    datosDeposito[clave]
    .yemaReal =
    Number(valor);

   guardarDepositos();

   renderDepositos();
   renderTotalesLitros();

};

window.actualizarPrensaReal =
function(clave,valor){

    datosDeposito[clave]
    .prensaReal =
    Number(valor);

    guardarDepositos();

    renderDepositos();
    renderTotalesLitros();

};

window.actualizarPH =
function(clave,valor){

    datosDeposito[clave]
    .ph =
    Number(valor);

    guardarDepositos();

    renderDepositos();
    renderTotalesLitros();

};

function guardarDepositos(){

    guardarDatos();

}

renderViticultores();
renderEntradas();
renderDepositos();

document
.getElementById("btnDescubado")
.addEventListener("click",()=>{

    document
    .querySelectorAll(".chkDeposito:checked")
    .forEach(chk=>{

        const clave =
        chk.dataset.clave;

        datosDeposito[clave].descubado = true;

    });

    guardarDepositos();
    renderDepositos();
    renderTotalesLitros();
    renderLias();
    renderHollejos();

});

document
.getElementById("btnQuitarDescubado")
.addEventListener("click",()=>{

    document
    .querySelectorAll(".chkDeposito:checked")
    .forEach(chk=>{

        const clave =
        chk.dataset.clave;

        datosDeposito[clave].descubado = false;

    });

    guardarDepositos();
    renderDepositos();
    renderTotalesLitros();
    renderLias();
    renderHollejos();

});

document
.getElementById("checkAllDepositos")
.addEventListener("change",function(){

    document
    .querySelectorAll(".chkDeposito")
    .forEach(chk=>{

        chk.checked = this.checked;

    });

});

document
.getElementById("checkAllEntradas")
.addEventListener("change",function(){

    document
    .querySelectorAll(".entrada-check")
    .forEach(check=>{

        check.checked =
        this.checked;

    });

});

document
.getElementById("deleteSelectedBtn")
.addEventListener("click",()=>{

    const seleccionados =
    [...document.querySelectorAll(
        ".entrada-check:checked"
    )]
    .map(c=>Number(c.dataset.index))
    .sort((a,b)=>b-a);

    if(
        seleccionados.length===0
    ){
        alert("No hay filas seleccionadas");
        return;
    }

    if(
        !confirm(
            "Eliminar filas seleccionadas?"
        )
    ) return;

    seleccionados.forEach(i=>{

        entradas.splice(i,1);

    });

    renderEntradas();
    renderDepositos();

    renderTotalesLitros();
    renderLias();
    renderHollejos();

    guardarDatos();

});

document
.getElementById("resetSelectedBtn")
.addEventListener("click",()=>{

    const seleccionados =
    [...document.querySelectorAll(
        ".entrada-check:checked"
    )]
    .map(c=>Number(c.dataset.index));

    if(
        seleccionados.length===0
    ){
        alert("No hay filas seleccionadas");
        return;
    }

    seleccionados.forEach(i=>{

        entradas[i] = {

            fecha:"",
            hora:"",

            titular:"",
            vina:"",
            dni:"",

            municipio:"",
            poligono:"",
            parcela:"",
            recinto:"",

            variedad:"",
            vendimia:"",

            kgBruto:0,
            kgTara:0,
            kgNeto:0,

            grado:0,

            deposito:"",
            vuelta:""

        };

    });

    renderEntradas();
    renderDepositos();
    guardarDatos();

    renderTotalesLitros();
    renderLias();
    renderHollejos();

});

// =======================================
// TOTALES
// =======================================

const tablaTotalesUva =
document.querySelector(
"#tablaTotalesUva tbody"
);

const tablaTotalesLitros =
document.querySelector(
"#tablaTotalesLitros tbody"
);

function renderTotales(){

    renderTotalesUva();
    renderTotalesLitros();

}

function renderTotalesUva(){

    tablaTotalesUva.innerHTML = "";

    const variedades = [

        "Tinta de Toro",
        "Garnacha",
        "Petit Verdot",
        "Cabernet Sauvignon",
        "Syrah",
        "Merlot",
        "Malvasía Aromática",
        "Chardonnay",
        "Verdejo",
        "Malvasía Castellana",
        "Albillo Real",
        "Moscatel",
        "Palomino",
        "Godello"

    ];

    let totalKg = 0;

   entradas.forEach(e=>{

    if(
        Number(e.anio || 2025)
        !== anioActivo
    ) return;

    totalKg += Number(
        e.kgNeto || 0
    );

});

    variedades.forEach(variedad=>{

        let kgVariedad = 0;

       entradas.forEach(e=>{

    if(
        Number(e.anio || 2025)
        !== anioActivo
    ) return;

    if(
        e.variedad === variedad
    ){

        kgVariedad += Number(
            e.kgNeto || 0
        );

    }

});

        const porcentaje =
        totalKg > 0
        ?
        (kgVariedad / totalKg) * 100
        :
        0;

        const tr =
        document.createElement("tr");

        tr.innerHTML = `

            <td>${variedad}</td>

            <td>
                ${kgVariedad.toFixed(0)}
            </td>

            <td>
                ${porcentaje.toFixed(2)} %
            </td>

        `;

        tablaTotalesUva.appendChild(tr);

    });

    const totalRow =
    document.createElement("tr");

    totalRow.style.fontWeight = "bold";

    totalRow.className =
"fila-total";

    totalRow.innerHTML = `

        <td>TOTAL</td>

        <td>
            ${totalKg.toFixed(0)}
        </td>

        <td>
            100 %
        </td>

    `;

    tablaTotalesUva.appendChild(totalRow);

}

function renderTotalesLitros(){

    tablaTotalesLitros.innerHTML = "";

    let totalYema = 0;
    let totalPrensa = 0;
    let totalPH = 0;

   Object.entries(datosDeposito)
.forEach(([clave,datos])=>{

    if(!datos.descubado) return;

    const existeEnAnio =
entradas.some(e =>

    Number(e.anio || 2025) === anioActivo &&

    `${anioActivo}-${e.deposito}-${e.vuelta}` === clave

);

    if(!existeEnAnio) return;

    totalYema += Number(datos.yemaReal || 0);

    totalPrensa += Number(datos.prensaReal || 0);

    totalPH += Number(datos.ph || 0);

});

    const totalLitros =
        totalYema +
        totalPrensa +
        totalPH;

        let kgDescubados = 0;

Object.entries(datosDeposito)
.forEach(([clave,datos])=>{

    if(!datos.descubado) return;

    const [anio, deposito, vuelta] =
clave.split("-");

    entradas.forEach(e=>{

        if(
    Number(e.anio || 2025)
    !== anioActivo
) return;

       if(
    Number(e.anio || 2025) === Number(anio) &&
    String(e.deposito) === deposito &&
    String(e.vuelta) === vuelta
){

            kgDescubados +=
            Number(e.kgNeto || 0);

        }

    });

});

    const filas = [

        {
            nombre:"Litros Yema",
            litros:totalYema
        },

        {
            nombre:"Litros Prensa",
            litros:totalPrensa
        },

        {
            nombre:"Litros pH",
            litros:totalPH
        }

    ];

    filas.forEach(f=>{

        const porcentaje =
kgDescubados > 0
?
(f.litros / kgDescubados) * 100
:
0;

        const tr =
        document.createElement("tr");

        tr.innerHTML = `

            <td>${f.nombre}</td>

            <td>
                ${f.litros.toFixed(0)}
            </td>

            <td>
                ${porcentaje.toFixed(2)} %
            </td>

        `;

        tablaTotalesLitros.appendChild(tr);

    });

    const totalRow =
    document.createElement("tr");

    totalRow.style.fontWeight =
    "bold";

    totalRow.className =
"fila-total";

    totalRow.innerHTML = `

        <td>TOTAL</td>

        <td>
            ${totalLitros.toFixed(0)}
        </td>

       <td>
    ${
    kgDescubados > 0
    ?
    (
        (totalLitros /
        kgDescubados) * 100
    ).toFixed(2)
    :
    0
    } %
</td>

    `;

    tablaTotalesLitros.appendChild(
        totalRow
    );

    const notaRow = document.createElement("tr");
notaRow.className = "fila-nota";

notaRow.innerHTML = `
    <td colspan="3">
        NOTA: LOS LITROS SON CORRESPONDIENTES A LOS DEPÓSITOS MARCADOS COMO DESCUBADOS Y EL PORCENTAJE CON RESPECTO A LOS KGS DE UVA DESCUBADOS
    </td>
`;

tablaTotalesLitros.appendChild(notaRow);

}

const liasTableBody =
document.querySelector(
"#liasTable tbody"
);

const hollejosTableBody =
document.querySelector(
"#hollejosTable tbody"
);

document
.getElementById("addLia")
.addEventListener("click",()=>{

    lias.push({

        anio: anioActivo,

        fecha:"",
        deposito:"",
        litros:0

    });

    renderLias();

});

document
.getElementById("addHollejo")
.addEventListener("click",()=>{

    hollejos.push({

        anio: anioActivo,

        fecha:"",
        deposito:"",
        kg:0

    });

    renderHollejos();

});

function guardarSubproductos(){

    guardarDatos();

}

// =======================================
// RENDER LÍAS
// =======================================

function renderLias(){

    if(!liasTableBody) return;

    liasTableBody.innerHTML = "";

    let totalLitrosLias = 0;

    let kgTotalesUva = 0;

entradas.forEach(e=>{

    if(
        Number(e.anio || 2025)
        !== anioActivo
    ) return;

    kgTotalesUva +=
    Number(e.kgNeto || 0);

});

    lias.forEach((lia,index)=>{

    if(
        Number(lia.anio || 2025)
        !== anioActivo
    ) return;

    totalLitrosLias +=
    Number(lia.litros || 0);

});

  lias.forEach((lia,index)=>{

    if(
        Number(lia.anio || 2025)
        !== anioActivo
    ) return;

    const porcentaje =
    kgTotalesUva > 0
    ?
    (
        Number(lia.litros) /
        kgTotalesUva
    ) * 100
    :
    0;

        const tr =
        document.createElement("tr");

        tr.innerHTML = `

        <td>

            <input
            type="date"
            value="${lia.fecha}"

            onchange="
            lias[${index}].fecha =
            this.value;
            guardarSubproductos();
            ">

        </td>

        <td>

            <input
            type="text"
            value="${lia.deposito}"

            onchange="
            lias[${index}].deposito =
            this.value;
            guardarSubproductos();
            ">

        </td>

        <td>

            <input
            type="number"
            value="${lia.litros}"

            onchange="
            actualizarLia(
            ${index},
            this.value
            )">

        </td>

        <td>
        ${porcentaje.toFixed(2)} %
        </td>

        <td>

            <button
            class="danger"
            onclick="
            eliminarLia(
            ${index}
            )">

            Eliminar

            </button>

        </td>

        `;

        liasTableBody.appendChild(tr);

    });

    document.getElementById(
        "totalLias"
    ).textContent =
    totalLitrosLias.toFixed(0);

   const porcentajeTotalLias =

kgTotalesUva > 0

?

(
    totalLitrosLias /
    kgTotalesUva
) * 100

:

0;

document.getElementById(
    "porcentajeLias"
).textContent =

porcentajeTotalLias.toFixed(2)
+ " %";

const notaRow = document.createElement("tr");
notaRow.className = "fila-nota";

notaRow.innerHTML = `
    <td colspan="5">
        NOTA: LOS LITROS DE LÍAS ES LO QUE VA SALIENDO DE LOS DEPÓSITOS Y EL PORCENTAJE ES CON RESPECTO A LOS KGS DE UVA TOTALES EN LAS ENTRADAS
    </td>
`;

liasTableBody.appendChild(notaRow);

}


// =======================================
// RENDER HOLLEJOS
// =======================================

function renderHollejos(){

    if(!hollejosTableBody) return;

    hollejosTableBody.innerHTML = "";

    let totalKg = 0;

    let kgDescubados = 0;

Object.entries(datosDeposito)
.forEach(([clave,datos])=>{

    if(!datos.descubado) return;

    const [deposito,vuelta] =
    clave.split("-");

    entradas.forEach(e=>{

    if(
        Number(e.anio || 2025)
        !== anioActivo
    ) return;

        if(
            String(e.deposito) === deposito &&
            String(e.vuelta) === vuelta
        ){

            kgDescubados +=
            Number(e.kgNeto || 0);

        }

    });

});

   hollejos.forEach(h=>{

    if(
        Number(h.anio || 2025)
        !== anioActivo
    ) return;

    totalKg +=
    Number(h.kg || 0);

});

    hollejos.forEach((h,index)=>{

    if(
        Number(h.anio || 2025)
        !== anioActivo
    ) return;

       const porcentaje =
kgDescubados > 0
?
(
    Number(h.kg) /
    kgDescubados
) * 100
:
0;

        const tr =
        document.createElement("tr");

        tr.innerHTML = `

        <td>

            <input
            type="date"
            value="${h.fecha}"

            onchange="
            hollejos[${index}].fecha =
            this.value;
            guardarSubproductos();
            ">

        </td>

        <td>

            <input
            type="text"
            value="${h.deposito}"

            onchange="
            hollejos[${index}].deposito =
            this.value;
            guardarSubproductos();
            ">

        </td>

        <td>

            <input
            type="number"
            value="${h.kg}"

            onchange="
            actualizarHollejo(
            ${index},
            this.value
            )">

        </td>

        <td>
        ${porcentaje.toFixed(2)} %
        </td>

        <td>

            <button
            class="danger"
            onclick="
            eliminarHollejo(
            ${index}
            )">

            Eliminar

            </button>

        </td>

        `;

        hollejosTableBody.appendChild(tr);

    });

    document.getElementById(
        "totalHollejos"
    ).textContent =
    totalKg.toFixed(0);

    const porcentajeTotalHollejos =

kgDescubados > 0

?

(
    totalKg /
    kgDescubados
) * 100

:

0;

document.getElementById(
    "porcentajeHollejos"
).textContent =

porcentajeTotalHollejos.toFixed(2)
+ " %";

const notaRow = document.createElement("tr");
notaRow.className = "fila-nota";

notaRow.innerHTML = `
    <td colspan="5">
        NOTA: LOS KGS DE HOLLEJOS ES LO QUE VA SALIENDO DE LAS PRENSAS Y EL PORCENTAJE ES CON RESPECTO A LOS KGS DE UVA DESCUBADOS
    </td>
`;

hollejosTableBody.appendChild(notaRow);

}

// =======================================
// ACTUALIZAR LÍAS
// =======================================

window.actualizarLia =
function(index,valor){

    lias[index].litros =
    Number(valor);

    guardarSubproductos();

    renderLias();
    renderTotalesLitros();

};

// =======================================
// ACTUALIZAR HOLLEJOS
// =======================================

window.actualizarHollejo =
function(index,valor){

    hollejos[index].kg =
    Number(valor);

    guardarSubproductos();

    renderHollejos();
    renderTotalesLitros();

};

// =======================================
// ELIMINAR LÍA
// =======================================

window.eliminarLia =
function(index){

    if(
        !confirm(
            "Eliminar registro de lías?"
        )
    ) return;

    lias.splice(index,1);

    guardarSubproductos();

    renderLias();
    renderTotalesLitros();

};

// =======================================
// ELIMINAR HOLLEJO
// =======================================

window.eliminarHollejo =
function(index){

    if(
        !confirm(
            "Eliminar registro?"
        )
    ) return;

    hollejos.splice(index,1);

    guardarSubproductos();

    renderHollejos();

};

renderViticultores();
renderEntradas();
renderDepositos();
renderLias();
renderHollejos();
renderTotalesLitros();
actualizarSelectorAnio();

function actualizarSelectorAnio(){

    const span =
    document.getElementById(
        "anioActual"
    );

    if(span){

        span.textContent =
        anioActivo;

    }

}

document
.getElementById("anioAnterior")
.addEventListener("click",()=>{

    anioActivo--;

    localStorage.setItem(
        "anioActivo",
        anioActivo
    );

    actualizarSelectorAnio();

    renderEntradas();
    renderDepositos();
    renderTotalesUva();
    renderTotalesLitros();
    renderLias();
    renderHollejos();

});

document
.getElementById("anioSiguiente")
.addEventListener("click",()=>{

    anioActivo++;

    localStorage.setItem(
        "anioActivo",
        anioActivo
    );

    actualizarSelectorAnio();

    renderEntradas();
    renderDepositos();
    renderTotalesUva();
    renderTotalesLitros();
    renderLias();
    renderHollejos();

});

document
.getElementById("exportJsonBtn")
.addEventListener("click", exportarJSON);

function exportarJSON(){

    const datos = {

        viticultores,
        entradas,
        datosDeposito,
        lias,
        hollejos,
        anioActivo

    };

    const contenido =
    JSON.stringify(datos, null, 2);

    const blob = new Blob(
        [contenido],
        { type:"application/json" }
    );

    const url =
    URL.createObjectURL(blob);

    const enlace =
    document.createElement("a");

    const fecha =
    new Date().toISOString().slice(0,10);

    enlace.href = url;

    enlace.download =
    `Vendimia_${fecha}.json`;

    enlace.click();

    URL.revokeObjectURL(url);

}

document
.getElementById("importJsonBtn")
.addEventListener("click",()=>{

    document
    .getElementById("importJsonInput")
    .click();

});

document
.getElementById("importJsonInput")
.addEventListener("change", importarJSON);

function importarJSON(event){

    const archivo =
    event.target.files[0];

    if(!archivo) return;

    const lector = new FileReader();

    lector.onload = function(e){

        try{

            const datos =
            JSON.parse(e.target.result);

            if(
                !confirm(
                    "Se sustituirán todos los datos actuales. ¿Continuar?"
                )
            ){
                return;
            }

            viticultores =
            datos.viticultores || [];

            entradas =
            datos.entradas || [];

            datosDeposito =
            datos.datosDeposito || {};

            lias =
            datos.lias || [];

            hollejos =
            datos.hollejos || [];

            anioActivo =
            datos.anioActivo ||
            new Date().getFullYear();

            guardarDatos();

            localStorage.setItem(
                "anioActivo",
                anioActivo
            );

            document
            .getElementById("anioActual")
            .textContent = anioActivo;

            renderViticultores();
            renderEntradas();
            renderDepositos();
            renderTotalesLitros();
            renderLias();
            renderHollejos();

            alert(
                "Datos importados correctamente"
            );

        }catch(error){

            alert(
                "El archivo JSON no es válido"
            );

        }

        event.target.value = "";

    };

    lector.readAsText(archivo);

}
