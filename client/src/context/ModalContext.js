import React, { createContext, useContext, useState } from 'react';
import TermsOfServiceModal from '@components/modals/legal/TermsOfServiceModal';
import PrivacyPolicyModal from '@components/modals/legal/PrivacyPolicyModal';

const ModalContext = createContext();

export function ModalProvider({ children }) {
    const [activeModal, setActiveModal] = useState(null);

    const openModal = (modalName) => setActiveModal(modalName);
    const closeModal = () => setActiveModal(null);

    return (
        <ModalContext.Provider value={{ openModal, closeModal }}>
            {children}

            {/* Globally rendered modals controlled by context */}
            <TermsOfServiceModal
                visible={activeModal === 'terms'}
                onClose={closeModal}
            />
            <PrivacyPolicyModal
                visible={activeModal === 'privacy'}
                onClose={closeModal}
            />
        </ModalContext.Provider>
    );
}

export const useModal = () => useContext(ModalContext);