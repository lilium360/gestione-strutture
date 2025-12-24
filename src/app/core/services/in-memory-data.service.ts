import { Injectable } from '@angular/core';
import { InMemoryDbService, RequestInfo, ResponseOptions } from 'angular-in-memory-web-api';
import { Structure } from '../models/structure.model';
import { Space } from '../models/space.model';
import { Feature } from '../models/feature.model';

@Injectable({
    providedIn: 'root'
})
export class InMemoryDataService implements InMemoryDbService {
    createDb() {
        const features: Feature[] = [
            { id: 'f1', name: 'Wi-Fi', icon: 'wifi', category: 'connectivity', description: 'High-speed wireless internet access' },
            { id: 'f2', name: 'Projector', icon: 'presentation', category: 'equipment', description: 'HD projector with HDMI connection' },
            { id: 'f3', name: 'Wheelchair Access', icon: 'accessibility', category: 'accessibility', description: 'Full wheelchair accessibility' },
            { id: 'f4', name: 'Air Conditioning', icon: 'thermometer', category: 'comfort', description: 'Climate controlled environment' },
            { id: 'f5', name: 'Video Conference', icon: 'video', category: 'equipment', description: 'Video conferencing system' },
            { id: 'f6', name: 'Whiteboard', icon: 'square', category: 'equipment', description: 'Large whiteboard for brainstorming' },
            { id: 'f7', name: 'Ethernet', icon: 'cable', category: 'connectivity', description: 'Wired ethernet connection' },
            { id: 'f8', name: 'Natural Light', icon: 'sun', category: 'comfort', description: 'Large windows with natural lighting' }
        ];

        // Real Italian landmark addresses with accurate coordinates and business details
        const structures: Structure[] = [
            {
                id: 's1',
                name: 'Palazzo Lombardia',
                address: 'Piazza Città di Lombardia 1',
                city: 'Milano',
                description: 'Sede della Regione Lombardia, edificio moderno con architettura contemporanea',
                openingHours: 'Mon-Fri: 08:00-18:00',
                phone: '+39 02 6765 1',
                email: 'info@regione.lombardia.it',
                coordinates: { lat: 45.4855, lng: 9.1921 },
                imageUrl: '',
                createdAt: new Date('2024-01-15'),
                updatedAt: new Date('2024-06-20')
            },
            {
                id: 's2',
                name: 'Grattacielo Intesa Sanpaolo',
                address: 'Corso Inghilterra 3',
                city: 'Torino',
                description: 'Sede centrale Intesa Sanpaolo, grattacielo progettato da Renzo Piano',
                openingHours: 'Mon-Fri: 08:30-17:30',
                phone: '+39 011 555 1',
                email: 'contact@intesasanpaolo.com',
                coordinates: { lat: 45.0725, lng: 7.6645 },
                imageUrl: '',
                createdAt: new Date('2024-03-10'),
                updatedAt: new Date('2024-07-15')
            },
            {
                id: 's3',
                name: 'Palazzo della Civiltà Italiana',
                address: 'Quadrato della Concordia 3',
                city: 'Roma',
                description: 'Iconico edificio dell\'EUR, ora sede di Fendi',
                openingHours: 'Tue-Sun: 10:00-20:00',
                phone: '+39 06 334 501',
                email: 'info@fendi.com',
                coordinates: { lat: 41.8355, lng: 12.4724 },
                imageUrl: '',
                createdAt: new Date('2024-02-20'),
                updatedAt: new Date('2024-08-01')
            },
            {
                id: 's4',
                name: 'Bosco Verticale',
                address: 'Via Gaetano de Castillia 11',
                city: 'Milano',
                description: 'Complesso residenziale green con oltre 900 alberi sulle facciate',
                openingHours: 'Mon-Fri: 09:00-19:00',
                phone: '+39 02 8888 1234',
                email: 'info@boscoverticalemilano.com',
                coordinates: { lat: 45.4858, lng: 9.1903 },
                imageUrl: '',
                createdAt: new Date('2024-04-01'),
                updatedAt: new Date('2024-09-15')
            },
            {
                id: 's5',
                name: 'Fondazione Prada',
                address: 'Largo Isarco 2',
                city: 'Milano',
                description: 'Complesso culturale e museo di arte contemporanea',
                openingHours: 'Wed-Mon: 10:00-21:00',
                phone: '+39 02 5666 2611',
                email: 'info@fondazioneprada.org',
                coordinates: { lat: 45.4443, lng: 9.2047 },
                imageUrl: '',
                createdAt: new Date('2024-05-10'),
                updatedAt: new Date('2024-10-01')
            },
            {
                id: 's6',
                name: 'Galleria Umberto I',
                address: 'Via San Carlo 15',
                city: 'Napoli',
                description: 'Storica galleria commerciale in stile liberty',
                openingHours: 'Mon-Sun: 08:00-22:00',
                phone: '+39 081 410 7211',
                email: 'info@galleriaumberto.it',
                coordinates: { lat: 40.8387, lng: 14.2497 },
                imageUrl: '',
                createdAt: new Date('2024-06-15'),
                updatedAt: new Date('2024-10-20')
            },
            {
                id: 's7',
                name: 'Palazzo Vecchio',
                address: 'Piazza della Signoria',
                city: 'Firenze',
                description: 'Storico palazzo comunale, museo e sede del comune di Firenze',
                openingHours: 'Mon-Sun: 09:00-19:00',
                phone: '+39 055 276 8325',
                email: 'info@musefirenze.it',
                coordinates: { lat: 43.7694, lng: 11.2558 },
                imageUrl: '',
                createdAt: new Date('2024-07-01'),
                updatedAt: new Date('2024-11-01')
            },
            {
                id: 's8',
                name: 'Arena di Verona',
                address: 'Piazza Bra 1',
                city: 'Verona',
                description: 'Anfiteatro romano, oggi sede di eventi e concerti',
                openingHours: 'Tue-Sun: 09:00-19:00',
                phone: '+39 045 800 5151',
                email: 'biglietteria@arena.it',
                coordinates: { lat: 45.4390, lng: 10.9942 },
                imageUrl: '',
                createdAt: new Date('2024-08-01'),
                updatedAt: new Date('2024-11-15')
            },
            {
                id: 's9',
                name: 'Museo Egizio',
                address: 'Via Accademia delle Scienze 6',
                city: 'Torino',
                description: 'Secondo museo egizio al mondo per importanza dopo quello del Cairo',
                openingHours: 'Mon: 09:00-14:00, Tue-Sun: 09:00-18:30',
                phone: '+39 011 440 6903',
                email: 'info@museoegizio.it',
                coordinates: { lat: 45.0683, lng: 7.6844 },
                imageUrl: '',
                createdAt: new Date('2024-09-01'),
                updatedAt: new Date('2024-12-01')
            }
        ];

        const spaces: Space[] = [
            // S1 - Palazzo Lombardia
            { id: 'sp1', structureId: 's1', name: 'Sala Conferenze Belvedere', type: 'meeting_room', capacity: 20, floor: '39', featureIds: ['f1', 'f2', 'f4', 'f5'], createdAt: new Date('2024-01-20'), updatedAt: new Date('2024-06-20') },
            { id: 'sp2', structureId: 's1', name: 'Ufficio Direzione', type: 'office', capacity: 1, floor: '35', featureIds: ['f1', 'f4', 'f7', 'f8'], createdAt: new Date('2024-01-20'), updatedAt: new Date('2024-05-10') },
            { id: 'sp3', structureId: 's1', name: 'Area Ristoro', type: 'kitchen', floor: '10', featureIds: ['f4'], createdAt: new Date('2024-01-20'), updatedAt: new Date('2024-01-20') },

            // S2 - Grattacielo Intesa Sanpaolo
            { id: 'sp4', structureId: 's2', name: 'Innovation Lab', type: 'common_area', capacity: 50, floor: '30', featureIds: ['f1', 'f2', 'f4', 'f6', 'f8'], createdAt: new Date('2024-03-15'), updatedAt: new Date('2024-07-10') },
            { id: 'sp5', structureId: 's2', name: 'Focus Room Piano', type: 'meeting_room', capacity: 8, floor: '25', featureIds: ['f1', 'f5', 'f6'], createdAt: new Date('2024-03-15'), updatedAt: new Date('2024-06-01') },

            // S3 - Palazzo della Civiltà Italiana
            { id: 'sp6', structureId: 's3', name: 'Showroom Fendi', type: 'common_area', capacity: 100, floor: '1', featureIds: ['f1', 'f2', 'f3', 'f4', 'f5'], createdAt: new Date('2024-02-25'), updatedAt: new Date('2024-08-01') },

            // S4 - Bosco Verticale
            { id: 'sp7', structureId: 's4', name: 'Coworking Space', type: 'common_area', capacity: 30, floor: '5', featureIds: ['f1', 'f4', 'f6', 'f7', 'f8'], createdAt: new Date('2024-04-05'), updatedAt: new Date('2024-09-10') },
            { id: 'sp8', structureId: 's4', name: 'Meeting Room Verde', type: 'meeting_room', capacity: 12, floor: '8', featureIds: ['f1', 'f2', 'f5', 'f8'], createdAt: new Date('2024-04-05'), updatedAt: new Date('2024-09-10') },
            { id: 'sp9', structureId: 's4', name: 'Terrazza Condivisa', type: 'common_area', capacity: 50, floor: '15', featureIds: ['f3', 'f8'], createdAt: new Date('2024-04-05'), updatedAt: new Date('2024-09-10') },

            // S5 - Fondazione Prada
            { id: 'sp10', structureId: 's5', name: 'Sala Esposizioni', type: 'common_area', capacity: 200, floor: '0', featureIds: ['f1', 'f3', 'f4'], createdAt: new Date('2024-05-15'), updatedAt: new Date('2024-10-01') },
            { id: 'sp11', structureId: 's5', name: 'Auditorium', type: 'meeting_room', capacity: 150, floor: '-1', featureIds: ['f1', 'f2', 'f3', 'f4', 'f5'], createdAt: new Date('2024-05-15'), updatedAt: new Date('2024-10-01') },
            { id: 'sp12', structureId: 's5', name: 'Bar Luce', type: 'kitchen', capacity: 40, floor: '0', featureIds: ['f1', 'f4'], createdAt: new Date('2024-05-15'), updatedAt: new Date('2024-10-01') },

            // S6 - Galleria Umberto I
            { id: 'sp13', structureId: 's6', name: 'Spazio Eventi Centrale', type: 'common_area', capacity: 300, floor: '0', featureIds: ['f1', 'f3', 'f4', 'f8'], createdAt: new Date('2024-06-20'), updatedAt: new Date('2024-10-20') },
            { id: 'sp14', structureId: 's6', name: 'Sale Private', type: 'meeting_room', capacity: 20, floor: '1', featureIds: ['f1', 'f2', 'f4', 'f5'], createdAt: new Date('2024-06-20'), updatedAt: new Date('2024-10-20') },

            // S7 - Palazzo Vecchio
            { id: 'sp15', structureId: 's7', name: 'Salone dei Cinquecento', type: 'common_area', capacity: 500, floor: '1', featureIds: ['f1', 'f3', 'f8'], createdAt: new Date('2024-07-05'), updatedAt: new Date('2024-11-01') },
            { id: 'sp16', structureId: 's7', name: 'Sala delle Udienze', type: 'meeting_room', capacity: 50, floor: '2', featureIds: ['f1', 'f2', 'f3', 'f4'], createdAt: new Date('2024-07-05'), updatedAt: new Date('2024-11-01') },
            { id: 'sp17', structureId: 's7', name: 'Torre di Arnolfo', type: 'common_area', capacity: 15, floor: '10', featureIds: ['f3', 'f8'], createdAt: new Date('2024-07-05'), updatedAt: new Date('2024-11-01') },

            // S8 - Arena di Verona
            { id: 'sp18', structureId: 's8', name: 'Palco Centrale', type: 'common_area', capacity: 1500, floor: '0', featureIds: ['f1', 'f3'], createdAt: new Date('2024-08-05'), updatedAt: new Date('2024-11-15') },
            { id: 'sp19', structureId: 's8', name: 'Backstage VIP', type: 'meeting_room', capacity: 30, floor: '-1', featureIds: ['f1', 'f4', 'f5'], createdAt: new Date('2024-08-05'), updatedAt: new Date('2024-11-15') },
            { id: 'sp20', structureId: 's8', name: 'Area Catering', type: 'kitchen', capacity: 20, floor: '-1', featureIds: ['f4'], createdAt: new Date('2024-08-05'), updatedAt: new Date('2024-11-15') },

            // S9 - Museo Egizio
            { id: 'sp21', structureId: 's9', name: 'Sala Statuaria', type: 'common_area', capacity: 80, floor: '0', featureIds: ['f1', 'f3', 'f4'], createdAt: new Date('2024-09-05'), updatedAt: new Date('2024-12-01') },
            { id: 'sp22', structureId: 's9', name: 'Aula Didattica', type: 'meeting_room', capacity: 40, floor: '1', featureIds: ['f1', 'f2', 'f3', 'f5', 'f6'], createdAt: new Date('2024-09-05'), updatedAt: new Date('2024-12-01') },
            { id: 'sp23', structureId: 's9', name: 'Caffetteria Museo', type: 'kitchen', capacity: 60, floor: '0', featureIds: ['f1', 'f3', 'f4'], createdAt: new Date('2024-09-05'), updatedAt: new Date('2024-12-01') }
        ];

        return { structures, spaces, features };
    }

    genId(collection: any[], collectionName: string): string {
        const prefix = collectionName === 'structures' ? 's' :
            collectionName === 'spaces' ? 'sp' : 'f';
        const maxId = collection.length > 0
            ? Math.max(...collection.map((item: any) => parseInt(item.id.replace(/\D/g, '') || '0')))
            : 0;
        return `${prefix}${maxId + 1}`;
    }
}
