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
                id:"tablaTotalesUva"
            },

            {
                titulo:"RESUMEN DE LITROS",
                id:"tablaTotalesLitros"
            },

            {
                titulo:"LÍAS DEL VINO",
                id:"liasTable"
            },

            {
                titulo:"HOLLEJOS PRENSADOS",
                id:"hollejosTable"
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

window.agregarAnio = function(index){

   const anio =
prompt("Año");

if(!anio) return;

const kg =
prompt("Kg de uva","0");

viticultores[index]
.historial
.push({

    anio,

    kg:Number(kg)||0

});

renderViticultores();
guardarDatos();

setTimeout(()=>{

    const fila =
    document.getElementById(
    `historial-${index}`
    );

    if(fila)
        fila.style.display =
        "table-row";

},10);}

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

window.editarViticultor =
function(index){

    const vit =
    viticultores[index];

    const nuevoNombre =
    prompt(
        "Nombre",
        vit.nombre
    );

    if(nuevoNombre === null)
        return;

    const nuevoDetalle =
    prompt(
        "Detalle",
        vit.detalle
    );

    vit.nombre = nuevoNombre;
    vit.detalle = nuevoDetalle;

    renderViticultores();
    guardarDatos();

};

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

window.agregarTitular =
function(vitIndex){

    const nombre =
    prompt("Nombre del titular");

    if(!nombre) return;

    const dni =
    prompt("DNI / CIF");

    viticultores[vitIndex]
    .titulares
    .push({

        nombre,
        dni,

        vinas:[],
mostrarVinas:false

    });

    renderViticultores();
    guardarDatos();

};

window.editarTitular =
function(vitIndex,titIndex){

    const titular =
    viticultores[vitIndex]
    .titulares[titIndex];

    const nombre =
    prompt(
        "Nombre",
        titular.nombre
    );

    if(nombre===null) return;

    const dni =
    prompt(
        "DNI / CIF",
        titular.dni
    );

    titular.nombre = nombre;
    titular.dni = dni;

    renderViticultores();
    guardarDatos();

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

window.agregarVina =
function(vitIndex,titIndex){

    const municipio = prompt("Municipio");
    if(!municipio) return;

    const poligono = prompt("Polígono");
    const parcela = prompt("Parcela");
    const recinto = prompt("Recinto");
    const paraje = prompt("Paraje");

    const variedad = prompt(
        "Variedad de uva"
    );

    const hectareas =
    Number(prompt("Hectáreas"));

    const kgHa =
    Number(prompt("Kg Hectárea Máximo"));

    const vendimia =
    prompt("Mano o Máquina");

    const anio =
    prompt("Año Viñedo");

    const rendimiento =
    hectareas * kgHa;

    viticultores[vitIndex]
    .titulares[titIndex]
    .vinas
    .push({

        municipio,
        poligono,
        parcela,
        recinto,
        paraje,

        variedad,

        hectareas,

        kgHa,

        rendimiento,

        vendimia,

        anio

    });

    recalcularHectareas(vitIndex);

    renderViticultores();
    guardarDatos();

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

    vina.municipio =
    prompt(
        "Municipio",
        vina.municipio
    );

    vina.poligono =
    prompt(
        "Polígono",
        vina.poligono
    );

    vina.parcela =
    prompt(
        "Parcela",
        vina.parcela
    );

    vina.recinto =
    prompt(
        "Recinto",
        vina.recinto
    );

    vina.paraje =
    prompt(
        "Paraje",
        vina.paraje
    );

    vina.variedad =
    prompt(
        "Variedad",
        vina.variedad
    );

    vina.hectareas =
    Number(
        prompt(
            "Hectáreas",
            vina.hectareas
        )
    );

    vina.kgHa =
    Number(
        prompt(
            "Kg/Ha",
            vina.kgHa
        )
    );

    vina.vendimia =
    prompt(
        "Vendimia",
        vina.vendimia
    );

    vina.anio =
    prompt(
        "Año",
        vina.anio
    );

    vina.rendimiento =
    vina.hectareas * vina.kgHa;

    recalcularHectareas(vitIndex);

    renderViticultores();
    guardarDatos();

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
        `${e.deposito}-${e.vuelta}`;

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
        `${grupo.deposito}-${grupo.vuelta}`;

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
    entradas.some(e=>

        Number(e.anio || 2025)
        === anioActivo &&

        `${e.deposito}-${e.vuelta}`
        === clave

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

