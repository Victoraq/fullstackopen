import React, { useState } from 'react'

const App = () => {
    const [ persons, setPersons] = useState([
        { name: 'Arto Hellas', number: '040-1234567'}
    ])
    const [ newName, setNewName ] = useState('')
    const [ newNumber, setNewNumber ] = useState('')

    const numbers = () => persons.map(p => <p key={p.name}>{p.name}  {p.number}</p>)

    const handleNameChange = (event) => {
        setNewName(event.target.value)
    }

    const handleNumberChange = (event) => {
        setNewNumber(event.target.value)
    }

    const addPerson = (event) => {
        event.preventDefault()

        // Look for the new name in the persons list to avoid repetition
        if (persons.find(p => p.name === newName)) {
            window.alert(`${newName} is already added to phonebook`)
            setNewName('')
            setNewNumber('')
            return
        }
        
        const newPerson = { name: newName, number: newNumber }

        setPersons(persons.concat(newPerson))
        setNewName('')
        setNewNumber('')
    }

    return (
        <div>
            <h2>Phonebook</h2>
            <form onSubmit={addPerson}>
            <div>name: <input value={newName} onChange={handleNameChange}/></div>
            <div>number: <input value={newNumber} onChange={handleNumberChange}/></div>
            <div>
                <button type="submit">add</button>
            </div>
            </form>
            <h2>Numbers</h2>
            {numbers()}
        </div>
    )
}

export default App