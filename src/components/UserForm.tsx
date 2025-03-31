import React, { useState, ChangeEvent } from 'react';

const UserForm: React.FC = () => {
    const [formData, setFormData] = useState({position: '', usage: '', latency: '' })

    const handleSubmit = () => {

    }
    const handleInputChange = () => {

    }
    return (
        <div>
            <div>
                <form onSubmit={handleSubmit}>
                    <label>What's your position:</label>
                    <input 
                        type='text' 
                        id='title' 
                        name='title' 
                        value={formData.position}
                        onChange={handleInputChange}
                    />
                    <label>What are you using this for?</label>
                    <label>How much latency can you take?</label>
                </form>
            </div>

        </div>

    )
}

export default UserForm;