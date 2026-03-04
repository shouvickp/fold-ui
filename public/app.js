const modal = document.getElementById("modal");

function openCreateModal() {

    document.getElementById("note_id").value = "";

    document.getElementById("form_method").value = "POST";

    document.getElementById("note_title_input").value = "";

    document.getElementById("note_content_input").value = "";

    modal.style.display = "flex";
}


function openEditModal(button) {

    document.getElementById("note_id").value =
        button.getAttribute("data-id");

    document.getElementById("form_method").value = "PUT";

    document.getElementById("note_title_input").value =
        button.getAttribute("data-title");

    document.getElementById("note_content_input").value =
        button.getAttribute("data-content");

    modal.style.display = "flex";
}


function closeModal() {

    modal.style.display = "none";

}



async function handleNoteSubmit(event) {

    event.preventDefault();

    const id =
        document.getElementById("note_id").value;

    const method =
        document.getElementById("form_method").value;

    const title =
        document.getElementById("note_title_input").value;

    const content =
        document.getElementById("note_content_input").value;


    const url = method === "PUT"
        ? `/note/${id}`
        : `/note`;


    try {

        const response = await fetch(url, {

            method: method,

            headers: {
                "Content-Type":
                    "application/x-www-form-urlencoded"
            },

            body: new URLSearchParams({

                note_title: title,

                note_content: content

            })

        });


        const result = await response.json();


        if (result.success) {

            location.reload();

        } else {

            alert(result.message || "Failed");

        }

    } catch (err) {

        console.log(err);

        alert("Server error");

    }

}



async function handleNoteDeletion(id) {

    if (!confirm("Delete note?")) return;

    try {

        const response = await fetch(

            `/note/remove/${id}`,

            { method: "DELETE" }

        );

        const result = await response.json();

        if (result.success) {

            location.reload();

        }

    } catch {

        alert("Delete failed");

    }

}