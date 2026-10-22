import React, { createContext, useCallback, useContext, useState } from "react";
import TermsOfServiceModal from '@components/modals/legal/TermsOfServiceModal';
import PrivacyPolicyModal from '@components/modals/legal/PrivacyPolicyModal';

const ModalContext = createContext(null);

export function ModalProvider({ children }) {
    const [activeModal, setActiveModal] = useState(null);

    const openModal = useCallback((modalName) => setActiveModal(modalName), []);
    const closeModal = useCallback(() => setActiveModal(null), []);

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

export const useModal = () => {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error("useModal must be used within a ModalProvider.");
    }
    return context;
};