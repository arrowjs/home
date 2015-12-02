'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define("version", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            validate: {
                isInt: {
                    msg: 'please input integer value ID'
                }
            }
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        alias: {
            type: DataTypes.STRING(255),
            unique: true,
            validate: {
                len: {
                    args: [0, 255],
                    msg: 'please input not too long alias'
                },
                isValid: function (value) {
                    if (typeof value !== 'string') {
                        throw new Error('Please input valid value');
                    } else if (value === '') {
                        this.alias = this.title.replace(/[ ]/g, '-').toLowerCase();
                    }
                }
            }
        },
        change_log_markdown: DataTypes.TEXT,
        change_log_html: DataTypes.TEXT,
        description: DataTypes.TEXT,
        is_current: DataTypes.BOOLEAN,
        published: {
            type: DataTypes.INTEGER,
            validate: {
                isIn: {
                    args: [['0', '1']],
                    msg: 'Please only input 0 and 1 values published'
                }
            }
        },
        created_at: {
            type: DataTypes.DATE,
            validate: {
                isDate: {
                    msg: 'Please input datetime value'
                }
            }
        },
        created_by: {
            type: DataTypes.INTEGER,
            validate: {
                isInt: {
                    msg: 'please input integer value'
                }
            },
            allowNull: false
        },
        modified_at: {
            type: DataTypes.DATE,
            validate: {
                isDate: {
                    msg: 'Please input datetime value'
                }
            }
        },
        modified_by: {
            type: DataTypes.INTEGER,
            validate: {
                isInt: {
                    msg: 'Please input integer value'
                }
            }
        }
    }, {
        tableName: 'version',
        createdAt: 'created_at',
        updatedAt: 'modified_at'
    });
};